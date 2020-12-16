import * as lodashFp from 'lodash/fp';
import * as E from 'fp-ts/Either';
import * as IOE from 'fp-ts/IOEither';
import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import {flow} from 'fp-ts/function';
import {pipe} from 'fp-ts/pipeable';

export const tryCatchError = <A>(f: () => Promise<A>, onRejected = E.toError) => TE.tryCatch(f, onRejected);

/** receives a value (usually an error, either in a catch block, promise `.catch` or a `Left` value) and throws it */
export const rethrow = <E>(e: E) => {throw e}

export const getOrThrowE = <E, A>(e: E.Either<E, A>) => E.getOrElse<E, A>(rethrow)(e);

const tagModuleMap = {Option: O, Either: E, TaskEither: TE, IOEither: IOE};

export type Awaitable<T> = PromiseLike<T> | T;
export type Resolved<T> = T extends Awaitable<infer X> ? X : never;
/** Union of fp-ts types that can be coerced safely into a "super-either" */
export type Eitherable<L, R> = O.Option<R> | E.Either<L, R> | IOE.IOEither<L, R> | TE.TaskEither<L, R>;

export interface TaggedError<T, Op> extends Error {
  message: string;
  stack: string;
  tag: T;
  op: Op;
}

/**
 * Returns a usually-human-readable, usually-single-line string output for any input object
 * In general, only includes type data, nothing sensitive
 */
export const splat = (input: unknown) => {
  if (typeof input === 'function')
    return (
      input.name ||
      input
        .toString()
        .split('\n')
        .filter((_, i, lines) => i === 0 || i === lines.length - 1)
        .map((line) => line.trim())
        .join(' ... ')
    );
  if (input instanceof Error) {
    return input.message;
  }

  if (!input || typeof input !== 'object') {
    return `value with type ${input && typeof input}`;
  }
  const str = `${input}`;
  if (input && str === '[object Object]') {
    return `Object with keys: [${Object.keys(input)}]`;
  }
  return str;
};

/**
 * Returns an error-tagging function, in exchange for a tag and an operation being performed.
 */
export const tagError = <T, Op>(tag: T, op: Op) => (input: unknown): TaggedError<T, any> => {
  const mutableError = input instanceof Error ? input : Error(`non-error left object found: ${input}`);
  return Object.assign(mutableError, {
    message: [mutableError.message, `[tag: ${tag}]`, op && `[op: ${splat(op)}]`].filter(Boolean).join(' '),
    stack: mutableError.stack || '',
    tag,
    op,
  });
};

/** Returns a function which receives errors, and tags them before rethrowing */
export const taggedRethrower = <T, Op>(tag: T, op: Op) => {
  const applyTag = tagError(tag, op);
  return (e: Error) => rethrow(applyTag(e))
};

type PropFn<Key extends string, F extends (...args: any[]) => any> = F | {[K in Key]: F}

export interface SuperTE<L, R, LNext = unknown, RNext = unknown> {
  /** returns the underlying Task(Either). See also `.getTE` for a lazy (and confusing) version of this which you might want sometimes */
  value: TE.TaskEither<L, R>;

  /** returns the same instance, but the compiler won't let you "widen" left types with `.chain`, or right types with `.orElse`/`.recover` */
  strict: SuperTE<L, R, L, R>;

  /**
   * an overly-lazy helper which _returns_ a TaskEither. This is only necessary because prettier is annoying and puts chained
   * properties (as opposed to function calls) on the wrong line. If you want to return a TaskEither, use this.
   * If you want to _call_ the TaskEither to get a Promise, use `.value`.
   */
  getTE: () => TE.TaskEither<L, R>;

  /** equivalent to `Promise.prototype.then`. Use this if you don't expect `fn` to fail */
  map: <Next>(fn: (val: R) => Awaitable<Next>) => SuperTE<L, Next>;

  /** convenience wrapper for `.map(list => list.flatMap(...))`. Is not usable unless `Right` is an array. */
  flatMap: R extends Array<infer X> ? <Next>(fn: (val: X) => Next[]) => SuperTE<L, Next[]> : never;

  /** convenience wrapper for lodash mapValues, with stricter types so you don't do something stupid, you stupid idiot. */
  mapValues: <Next>(fn: (val: R[keyof R], key: string) => Next) => SuperTE<L, Record<keyof R, Next>>;

  /** like `.map`, But the function call will be `try-catch`ed and errors will pipe to a `Left` */
  tryMap: <Tag extends string, Next>(
    tag: Tag,
    fn: (val: R) => Awaitable<Next>,
    onError?: (e: unknown) => Error
  ) => SuperTE<L | TaggedError<Tag, typeof fn>, Next>;

  /**
   * Similar to `Promise.all`. If `fn` returns an array of promises, they'll be `try-catch`ed, any error piping to `Left` and awaited
   * Often `tryMapStruct` is preferable - it uses keys as labels rather than relying on the ordering of the array.
   */
  tryMapMany: <Tag extends string, Next>(
    tag: Tag,
    fn: (val: R) => Awaitable<Next>[],
    onError?: (e: unknown) => Error
  ) => SuperTE<L | TaggedError<Tag, typeof fn>, Next[]>;

  /**
   * like `.tryMapMany` or `Promise.all` but you can pass in a dictionary of promises, similar to fp-ts's `sequenceS`.
   * @example
   * const googleClient = {search: async q => ...}
   * const bingClient = {search: async q => ...}
   *
   * fp
   *   .start(query)
   *   .tryMapStruct(q => ({
   *     googleResults: googleClient.search(q),
   *     bingResults: bingClient.search(q),
   *   }))
   *   .map(r => r.googleResults.length > r.bingResults.length ? 'Google had more results' : 'Bing had more results')
   */
  tryMapStruct: <Tag extends string, Struct extends Record<string, Awaitable<any>>>(
    tag: Tag,
    fn: (val: R) => Struct,
    onError?: (e: unknown) => Error
  ) => SuperTE<L | TaggedError<Tag, typeof fn>, {[K in keyof Struct]: Resolved<Struct[K]>}>;

  /**
   * Filter a right into a `TaggedError` left if it fails to meet a condition
   * This is like `filterOrElse` but gives you fewer choices - the left result is always a `TaggedError`.
   */
  filter: <Tag extends string>(
    tag: Tag,
    fn: (val: R) => boolean | unknown,
    onFalse?: (e: R) => Error
  ) => SuperTE<L | TaggedError<Tag, typeof fn>, R>;

  /** @experimental **only applies to array types** convenience wrapper for `.tryMapMany(arr => arr.map(fn))` */
  tryMapEach: R extends Array<infer Item>
  ? <Tag extends string, Next>(
    tag: Tag,
    fn: (item: Item) => Awaitable<Next>,
    onError?: (e: unknown) => Error
  ) => SuperTE<L | TaggedError<Tag, (item: Item) => Awaitable<Next>>, Next[]>
  : unknown;

  /** equivalent to fp-ts's Either.mapLeft, TaskEither.mapLeft, IOEither.mapLeft etc. */
  mapLeft: <Next>(fn: (val: L) => Next) => SuperTE<Next, R>;

  /** like `.map`, but the input will be an `Either`. Useful if you want to use an existing static function, say `E.fold` from fp-ts */
  mapEither: <Next>(fn: (val: E.Either<L, R>) => Awaitable<Next>) => SuperTE<never, Next>;

  /** like `.mapEither`, but errors will be caught and tagged */
  tryMapEither: <Tag extends string, Next>(
    tag: Tag,
    fn: (val: E.Either<L, R>) => Awaitable<Next>
  ) => SuperTE<TaggedError<Tag, typeof fn>, Next>;

  /**
   * equivalent to fp-ts's `.chain` functions. Useful for composing with another function that returns an Option/Either/TaskEither/IOEither
   * - note: `Left`s are "widened", so you can chain from a `<L1, R1>` to a `<L2, R2>` - the result will be a `<L1 | L2, R2>`. To have the compiler prevent widening, see `.strict`
   */
  chain<L2 extends LNext, R2>(fn: (val: R) => Eitherable<L2, R2>): SuperTE<L | L2, R2>;

  /** like `.chain`, but the input will be an `Either`. Useful if you want to use an existing static function, say `E.swap` from fp-ts */
  chainEither<L2 extends LNext, R2>(fn: (val: E.Either<L, R>) => Eitherable<L2, R2>): SuperTE<L2, R2>;

  /**
   * equivalent to fp-ts's `.orElse` functions. Generally, useful for recovering from errors. See also `.recover` and `.recoverTruthy` for some opinionated helpers which wrap this function.
   * - note: `Right`s are "widened", so you can chain from a `<L1, R1>` to a `<L2, R2>` - the result will be a `<L1, R1 | R2>`. To have the compiler prevent widening, see `.strict`
   */
  orElse<L2, R2 extends RNext>(fn: (left: L) => Eitherable<L2, R2>): SuperTE<L2, R | R2>;

  /**
   * If `condition` returns a truthy value, the return value of `recoverer` will be put in a `Right`.
   * Useful for recovering from errors, say with default values
   */
  recover<R2 extends RNext>(condition: (left: L) => boolean | unknown, recoverer: (left: L) => R2): SuperTE<L, R | R2>;

  /** like `.recover`, but re-uses the condition function as the recoverer. Falsy return values will result in no recovery */
  recoverTruthy<R2 extends RNext>(recoverer: (left: L) => R2 | null | undefined | false | ''): SuperTE<L, R | R2>;

  into<Key extends string>(key: Key): SuperTE<L, {[K in Key]: R}>;
  bind<Key extends string, RValue>(key: Key, fn: (right: R) => Awaitable<RValue>): SuperTE<L, R & {[K in Key]: RValue}>;
  exec(fn: (right: R) => Awaitable<unknown>): SuperTE<L, R>
  mapKey<SourceKey extends keyof R, TargetKey extends string, RValue>(sourceKey: SourceKey, targetKey: TargetKey, fn: (rightProp: R[SourceKey]) => Awaitable<RValue>): SuperTE<L, R & {[K in TargetKey]: RValue}>
  focus<Key extends keyof R>(key: Key): SuperTE<L, R[Key]>

  /** resolve the `right` value, or throw if `left` */
  getUnsafe: <Tag extends string>(tag: Tag) => PromiseLike<R>;

  /** At runtime, exactly the same as `.getUnsafe`. But the compiler will stop you calling this unless the `Left` type is `never` */
  getSafe: [L] extends [never] ? () => PromiseLike<R> : never;
}

export type LeftOf<T> = T extends Eitherable<infer X, any> ? X : never;
export type RightOf<T> = T extends Eitherable<any, infer X> ? X : never;

type SuperTEStatic = typeof tagModuleMap & {
  of: <R = undefined>(val?: R) => SuperTE<never, R>;
  wrap<L, R>(val: Eitherable<L, R>): SuperTE<L, R>;
};

const toTaskEither = <L, R>(val: Eitherable<L, R>): TE.TaskEither<L, R> => {
  // if it's a function it could be:
  // either: `TaskEither = Task<Either> = () => Promise<Either>`
  // or      `IOEither = IO<Either> = () => Either`
  // asyncifying it makes sure it returns a promise, so is a TaskEither
  if (typeof val === 'function') return async () => val();

  const stringify = () => `tag: ${val?._tag} keys: ${Object.keys(val || {})}`;

  if (val._tag === 'None' || val._tag === 'Some') return TE.fromOption(() => undefined)(val) as any;
  if (val._tag === 'Left' || val._tag === 'Right') return TE.fromEither(val);

  const msg = `Can't convert value ${stringify()} to TaskEither. It should be one of Option, Either, IOEither or TaskEither`;
  throw Error(msg);
};

export const SuperTE: SuperTEStatic = {
  ...tagModuleMap,
  of: (val?: any) => SuperTE.wrap(O.some(val)),
  wrap: (val) => {
    const rawTE = toTaskEither(val);
    type L = LeftOf<typeof rawTE>;
    type R = RightOf<typeof rawTE>;
    const superTE: SuperTE<L, R> = {
      map: (fn) => superTE.chain((next) => async () => E.right(await fn(next))),
      mapEither: (fn) => superTE.chainEither((either) => async () => E.right(await fn(either))),
      tryMapEither: (tag, fn) =>
        superTE.chainEither((either) => tryCatchError(async () => fn(either))).mapLeft(tagError(tag, fn)),
      mapValues: (fn) => superTE.map(lodashFp.mapValues(fn)) as any,
      tryMap: (tag, fn, onError) =>
        superTE.chain((next) => tryCatchError(async () => fn(next), onError)).mapLeft(tagError(tag, fn)),
      tryMapMany: (tag, fn, onError) =>
        superTE.chain((next) => tryCatchError(async () => Promise.all(fn(next)), onError)).mapLeft(tagError(tag, fn)),
      tryMapStruct: (tag, fn, onError) =>
        superTE
          .chain((next) => () =>
            tryCatchError(async () => {
              const promiseDict = fn(next);
              const promiseList = Object.entries(promiseDict).map(([key, promise]) =>
                Promise.resolve(promise)
                  .catch(taggedRethrower(key, promise))
                  .then((resolved) => [key, resolved])
              );
              const resolvedEntries = await Promise.all(promiseList);
              return resolvedEntries.reduce((acc, [k, v]) => ({...acc, [k]: v}), {} as any);
            }, onError)()
          )
          .mapLeft(tagError(tag, fn)),
      // @ts-expect-error tryMapEach is typed as `never` for non-arrays, since it has undefined behaviour in those cases.
      // typescript gets angry about this, as it should. We're jumping on the grenade and losing type safety here so that
      // downstream consumers don't have to. We're relying on being well convered by unit tests.
      tryMapEach: (tag, fn, onError) => {
        return superTE.tryMapMany(tag, (list: unknown) => (list as any[]).map(fn), onError).mapLeft(tagError(tag, fn));
      },
      // @ts-expect-error flatMap is typed as `never` for non-arrays, since it has undefined behaviour in those cases.
      flatMap: (fn) => {
        return superTE.map((list: unknown) => (list as any[]).flatMap(fn));
      },
      mapLeft: (fn) => superTE.chainEither(E.mapLeft(fn)),
      chainEither: (fn) => {
        return SuperTE.wrap(async () => {
          return pipe(await rawTE(), async (prev) => {
            const next = await fn(prev);
            return toTaskEither(next)();
          });
        });
      },
      chain: <L2, R2>(fn: (val: R) => Eitherable<L2, R2>): SuperTE<L | L2, R2> =>
        superTE.chainEither((either): Eitherable<L | L2, R2> => (E.isRight(either) ? fn(either.right) : either)),
      orElse: <L2, R2>(fn: (left: L) => Eitherable<L2, R2>): SuperTE<L2, R | R2> =>
        superTE.chainEither((either): Eitherable<L2, R | R2> => (E.isLeft(either) ? fn(either.left) : either)),
      filter: (tag, fn, onFalse = (r: R) => Error(`filter returned false for {${splat(r)}}`)) =>
        superTE.map(E.right).chain(E.filterOrElse(flow(fn, Boolean), flow(onFalse, tagError(tag, fn)))),
      value: rawTE,
      getTE: () => rawTE,
      recover: (condition, recoverer) =>
        superTE.orElse((left) => (condition(left) ? E.right(recoverer(left)) : E.left(left))),
      recoverTruthy: (recoverer) =>
        superTE.orElse((left) => {
          const next = recoverer(left);
          return next ? E.right(next) : E.left(left);
        }),
      into: key => superTE.map(val => ({[key]: val} as {[K in typeof key]: typeof val})),
      bind: (key, fn) => superTE.map(async val => {
        const newProp = await fn(val)
        type TargetType = (typeof val) & {[K in typeof key]: typeof newProp}
        return {...val, [key]: newProp} as TargetType
      }),
      // bind: (key, fn) => 
      exec: fn => superTE.map(async val => {
        await fn(val)
        return val
      }),
      mapKey: (source, target, fn) => superTE.bind(target, val => fn(val[source])),
      getUnsafe: (tag) =>
        superTE.mapLeft(splat).mapLeft(Error).mapLeft(tagError(tag, superTE.getUnsafe)).value().then(getOrThrowE),
      // @ts-expect-error - it isn't safe to unsafely get. But the type system will prevent users from doing this
      getSafe: () => superTE.getUnsafe('expectedRight'),
      strict: null as never, // self reference, mutably set below
    };
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    superTE.strict = superTE;
    return superTE;
  },
};

export const start = SuperTE.of;
export {E, O, IOE, T, TE};
export const Either = E;
export const Option = O;
export const IOEither = IOE;
export const Task = T;
export const TaskEither = TE;

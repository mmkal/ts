import * as Either from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import {IsNeverOrAny, RichError} from './util'

/** Not a real type that anything will have at runtime. Just a way of giving helpful compiler errors. */
type UnionOfCasesDoesNotMatchExpected<InSoFar, In> =
  | {
      /** compile time only. basically a fake property to signal at compile time that you didn't exhaustively match before calling `.get`. Don't try to use this value, it won't exist! */
      _message: 'type union of inputs for cases does not match expected input type. try adding more case statements or use .default(...)'
      /** compile time only. basically a fake property to signal at compile time that you didn't exhaustively match before calling `.get`. Don't try to use this value, it won't exist! */
      _actual: InSoFar
      /** compile time only. basically a fake property to signal at compile time that you didn't exhaustively match before calling `.get`. Don't try to use this value, it won't exist! */
      _expected: In
      /** compile time only. basically a fake property to signal at compile time that you didn't exhaustively match before calling `.get`. Don't try to use this value, it won't exist! */
      _unhandled: Exclude<In, InSoFar>
    }
  | never

type Mappable<In, NextIn> = IsNeverOrAny<In> extends 1 ? NextIn : In & NextIn

interface MatcherBuilder<In, InSoFar, Out> {
  case: {
    <NextIn, MapperIn extends Mappable<In, NextIn>, NextOut>(
      type: t.RefinementType<t.Type<NextIn>>,
      map: (obj: MapperIn) => NextOut
    ): MatcherBuilder<In, InSoFar, Out | NextOut>
    <NextIn, MapperIn extends Mappable<In, NextIn>, NextOut>(
      type: t.Type<NextIn>,
      map: (obj: MapperIn) => NextOut
    ): MatcherBuilder<In, InSoFar | NextIn, Out | NextOut>
  }
  default: <NextOut>(map: (obj: In) => NextOut) => MatcherBuilder<In, any, Out | NextOut>
  get: IsNeverOrAny<Exclude<In, InSoFar>> extends 1
    ? (obj: InSoFar) => Out
    : UnionOfCasesDoesNotMatchExpected<InSoFar, In>
  tryGet: (obj: In) => Hopefully<Out>
}

interface PatternMatchBuilder<In, InSoFar, Out> {
  case: {
    <NextIn, NextOut>(
      type: t.RefinementType<t.Type<NextIn>>,
      map: (obj: Mappable<In, NextIn>) => NextOut
    ): PatternMatchBuilder<In, InSoFar, Out | NextOut>
    <NextIn, NextOut>(type: t.Type<NextIn>, map: (obj: Mappable<In, NextIn>) => NextOut): PatternMatchBuilder<
      In,
      InSoFar | NextIn,
      Out | NextOut
    >
  }
  default: <NextOut>(map: (obj: In) => NextOut) => PatternMatchBuilder<In, any, Out | NextOut>
  get: IsNeverOrAny<Exclude<In, InSoFar>> extends 1 ? () => Out : UnionOfCasesDoesNotMatchExpected<InSoFar, In>
}

type UnknownFn = (obj: unknown) => unknown
type Cases = Array<[t.Type<any>, UnknownFn]>

const maybeMatchObject = (obj: any, cases: Cases) => {
  for (const [type, map] of cases) {
    const decoded = type.decode(obj)
    if (decoded._tag === 'Right') {
      return Either.right(map(decoded.right))
    }
  }
  return Either.left({noMatchFoundFor: obj, types: cases.map(c => c[0])})
}
const matchObject = (obj: any, cases: Cases) => {
  const either = maybeMatchObject(obj, cases)
  if (either._tag === 'Right') {
    return either.right
  }

  RichError.throw({noMatchFoundFor: obj, types: cases.map(c => c[0])})
}

const patternMatcher = <In = any, InSoFar = never, Out = never>(
  cases: Cases,
  obj: In
): PatternMatchBuilder<In, InSoFar, Out> =>
  ({
    case: (type: t.Type<unknown>, map: UnknownFn) => patternMatcher(cases.concat([[type, map]]), obj),
    default: (map: UnknownFn) => patternMatcher(cases.concat([[t.any, map]]), obj),
    get: () => matchObject(obj, cases),
  } as any)

/**
 * Match an object against a number of cases. Loosely based on Scala's pattern matching.
 *
 * @example
 * // get a value which could be a string or a number:
 * const value = Math.random() < 0.5 ? 'foo' : 123
 * const stringified = match(value)
 *  .case(t.number, n => `the number is ${n}`)
 *  .case(t.string, s => `the message is ${s}`)
 *  .get()
 *
 * @description
 * you can use `t.refinement` for the equivalent of scala's `case x: Int if x > 2`:
 *
 * @example
 * // value which could be a string, or a real number in [0, 10):
 * const value = Math.random() < 0.5 ? 'foo' : Math.random() * 10
 * const stringified = match(value)
 *  .case(t.refinement(t.number, n => n > 2), n => `big number: ${n}`)
 *  .case(t.number, n => `small number: ${n}`)
 *  .default(x => `not a number: ${x}`)
 *  .get()
 *
 * @description
 *
 * note: when using `t.refinement`, the type being refined is not considered as exhaustively matched,
 * so you'll usually need to add a non-refined option, or you can also use `.default` as a fallback
 * case (the equivalent of `.case(t.any, ...)`)
 *
 * @param obj the object to be pattern-matched
 */
export const match = <Input>(obj: Input) => patternMatcher([], obj)

/**
 * Like @see match but no object is passed in when constructing the case statements.
 * Instead `.get` is a function into which a value should be passed.
 * @example
 * const Email = t.type({sender: t.string, subject: t.string, body: t.string})
 * const SMS = t.type({from: t.string, content: t.string})
 * const Message = t.union([Email, SMS])
 * type Message = typeof Message._A
 *
 * const content = matcher<MessageType>()
 *   .case(SMS, s => s.content)
 *   .case(Email, e => e.subject + '\n\n' + e.body)
 *   .get({from: '123', content: 'hello'})
 *
 * expect(content).toEqual('hello')
 * @description
 * The function returned by `.get` is stateless and has no `this` context,
 * you can store it in a variable and pass it around:
 *
 * @example
 * const getContent = matcher<Message>()
 *   .case(SMS, s => s.content)
 *   .case(Email, e => e.subject + '\n\n' + e.body)
 *   .get
 *
 * const allMessages: Message[] = getAllMessages();
 * const contents = allMessages.map(getContent);
 */
export const matcher = <In = any>(): MatcherBuilder<In, never, never> => matcherRecursive([])

const matcherRecursive = <In = any, InSoFar = never, Out = never>(cases: Cases): MatcherBuilder<In, InSoFar, Out> =>
  ({
    case: (type: t.Any, map: UnknownFn) => matcherRecursive(cases.concat([[type, map]])),
    default: (map: UnknownFn) => matcherRecursive(cases.concat([[t.any, map]])),
    get: (obj: unknown) => matchObject(obj, cases),
    tryGet: (obj: unknown) => maybeMatchObject(obj, cases),
  } as any)

export const collect = <T, U>(items: T[], partialFunc: (t: T) => Hopefully<U>) =>
  items
    .map(partialFunc)
    .filter((o): o is Either.Right<U> => o._tag === 'Right')
    .map(o => o.right)

export type Hopefully<T> = Either.Either<unknown, T>

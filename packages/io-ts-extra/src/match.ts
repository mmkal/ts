import * as Either from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import {IsNeverOrAny, RichError} from './util'

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

interface PartialFunctionBuilder<In, InSoFar, Out> {
  case: {
    <NextIn extends In, MapperIn extends NextIn, NextOut>(
      type: t.RefinementType<t.Type<NextIn>>,
      map: (obj: MapperIn) => NextOut
    ): PartialFunctionBuilder<In, InSoFar, Out | NextOut>
    <NextIn extends In, MapperIn extends NextIn, NextOut>(
      type: t.Type<NextIn>,
      map: (obj: MapperIn) => NextOut
    ): PartialFunctionBuilder<In, InSoFar | NextIn, Out | NextOut>
  }
  default: <NextOut>(map: (obj: In) => NextOut) => PartialFunctionBuilder<In, any, Out | NextOut>
  get: IsNeverOrAny<Exclude<In, InSoFar>> extends 1
    ? (obj: InSoFar) => Out
    : UnionOfCasesDoesNotMatchExpected<InSoFar, In>
  tryGet: (obj: In) => Hopefully<Out>
}

interface PatternMatchBuilder<In, InSoFar, Out> {
  case: {
    <NextIn extends In, NextOut>(
      type: t.RefinementType<t.Type<NextIn>>,
      map: (obj: NextIn) => NextOut
    ): PatternMatchBuilder<In, InSoFar, Out | NextOut>
    <NextIn extends In, NextOut>(type: t.Type<NextIn>, map: (obj: NextIn) => NextOut): PatternMatchBuilder<
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

  for (const c of cases) {
    if (c[0].is(obj)) {
      return c[1](obj)
    }
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
 * match an object against a number of cases.
 * @example
 * ```typescript
// get a value which could be a string or a number:
const value = Math.random() < 0.5 ? 'foo' : 123
const stringified = match(value)
    .case(t.number, n => `the number is ${n}`)
    .case(t.string, s => `the message is ${s}`)
    .get()
```
 * you can use `t.refinement` for the equivalent of scala's `case x: Int if x > 2`
 * note: when using `t.refinement`, the type being refined is not considered as exhaustively matched,
 * so you'll usually need to add a non-refined option, or you can also use `.default` as a fallback
 * case (the equivalent of `.case(t.any, ...)`):
 * @example
 * ```typescript
// value which could be a string, or a real number in [0, 10):
const value = Math.random() < 0.5 ? 'foo' : Math.random() * 10
const stringified = match(value)
    .case(t.refinement(t.number, n => n > 2), n => `big number: ${n}`)
    .case(t.number, n => `small number: ${n}`)
    .default(x => `not a number: ${x}`)
    .get()
```
 * @param obj the object to be pattern-matched
 */
export const match = <Input>(obj: Input) => patternMatcher([], obj)

/**
 * Like @see match but no object is passed in when constructing the case statements.
 * Instead `.get` is a function into which a value should be passed.
 * @example
 *  ```typescript
const Cat = t.interface({ miaow: t.string })
const Dog = t.interface({ bark: t.string })
const Pet = t.union([Cat, Dog])
type Pet = typeof Pet._A

const petSound = partialFunction<Pet>()
    .case(Dog, d => d.bark)
    .case(Cat, c => c.miaow)
    .get(myPet)
```
 * The function returned by `.get` is stateless and has no `this` context,
 * you can store it in a variable and pass it around:
 * @example
 * ```typescript
const getPetSound = partialFunction<Pet>()
    .case(Dog, d => d.bark)
    .case(Cat, c => c.miaow)
    .get

const allPets: Pet[] = getAllPets();
// sounds for all pets, using the function created above:
const cacophony = allPets.map(getPetSound);
```
 */
export const partialFunction = <In = any>(): PartialFunctionBuilder<In, never, never> => partialFunctionRecursive([])

const partialFunctionRecursive = <In = any, InSoFar = never, Out = never>(
  cases: Cases
): PartialFunctionBuilder<In, InSoFar, Out> =>
  ({
    case: (type: t.Any, map: UnknownFn) => partialFunctionRecursive(cases.concat([[type, map]])),
    default: (map: UnknownFn) => partialFunctionRecursive(cases.concat([[t.any, map]])),
    get: (obj: unknown) => matchObject(obj, cases),
    tryGet: (obj: unknown) => maybeMatchObject(obj, cases),
  } as any)

export const collect = <T, U>(items: T[], partialFunc: (t: T) => Hopefully<U>) =>
  items
    .map(partialFunc)
    .filter(o => o._tag === 'Right')
    .map(o => (o._tag === 'Right' ? o.right : RichError.throw(o)))

export type Hopefully<T> = Either.Either<unknown, T>

export type Not<T extends boolean> = T extends true ? false : true
export type Or<Types extends boolean[]> = Types[number] extends false ? false : true
export type And<Types extends boolean[]> = Types[number] extends true ? true : false
export type Eq<Left extends boolean, Right extends boolean> = Left extends true ? Right : Not<Right>
export type Xor<Types extends [boolean, boolean]> = Not<Eq<Types[0], Types[1]>>

const secret = Symbol('secret')
type Secret = typeof secret

export type IsNever<T> = [T] extends [never] ? true : false
export type IsAny<T> = [T] extends [Secret] ? Not<IsNever<T>> : false
export type IsUnknown<T> = [unknown] extends [T] ? Not<IsAny<T>> : false
export type IsNeverOrAny<T> = Or<[IsNever<T>, IsAny<T>]>

export type Extends<L, R> = L extends R ? true : false
export type Equal<Left, Right> = And<
  [
    Extends<Left, Right>, // prettier-break
    Extends<Right, Left>,
    Extends<keyof Left, keyof Right>,
    Extends<keyof Right, keyof Left>
  ]
>

export type Params<Actual> = Actual extends (...args: infer P) => any ? P : [never]

type MismatchArgs<B extends boolean, C extends boolean> = Eq<B, C> extends true ? [] : [never]
export interface ExpectTypeOf<Actual, B extends boolean> {
  toBeAny: (...MISMATCH: MismatchArgs<IsAny<Actual>, B>) => true
  toBeUnknown: (...MISMATCH: MismatchArgs<IsUnknown<Actual>, B>) => true
  toBeNever: (...MISMATCH: MismatchArgs<IsNever<Actual>, B>) => true
  toBeFunction: (...MISMATCH: MismatchArgs<Extends<Actual, (...args: any[]) => any>, B>) => true
  toBeObject: (...MISMATCH: MismatchArgs<Extends<Actual, object>, B>) => true
  toBeArray: (...MISMATCH: MismatchArgs<Extends<Actual, any[]>, B>) => true
  toBeNumber: (...MISMATCH: MismatchArgs<Extends<Actual, number>, B>) => true
  toBeString: (...MISMATCH: MismatchArgs<Extends<Actual, string>, B>) => true
  toBeBoolean: (...MISMATCH: MismatchArgs<Extends<Actual, boolean>, B>) => true
  toBeSymbol: (...MISMATCH: MismatchArgs<Extends<Actual, Symbol>, B>) => true
  toBeNull: (...MISMATCH: MismatchArgs<Extends<Actual, null>, B>) => true
  toBeUndefined: (...MISMATCH: MismatchArgs<Extends<Actual, undefined>, B>) => true
  toBeNullable: (...MISMATCH: MismatchArgs<Not<Equal<Actual, NonNullable<Actual>>>, B>) => true
  toMatchTypeOf: <Expected>(expected?: Expected, ...MISMATCH: MismatchArgs<Extends<Actual, Expected>, B>) => true
  toEqualTypeOf: <Expected>(expected?: Expected, ...MISMATCH: MismatchArgs<Equal<Actual, Expected>, B>) => true
  toBeCallableWith: B extends true ? ((...args: Params<Actual>) => true) : never
  parameter<K extends keyof Params<Actual>>(number: K): ExpectTypeOf<Params<Actual>[K], B>
  returns: Actual extends (...args: any[]) => infer R ? ExpectTypeOf<R, B> : never
  resolves: Actual extends PromiseLike<infer R> ? ExpectTypeOf<R, B> : never
  items: Actual extends ArrayLike<infer R> ? ExpectTypeOf<R, B> : never
  not: ExpectTypeOf<Actual, Not<B>>
}
const fn: any = () => true
export const expectTypeOf = <Actual>(actual?: Actual): ExpectTypeOf<Actual, true> => {
  const nonFunctionProperties = ['returns', 'resolves', 'not', 'items'] as const
  type Keys = keyof ExpectTypeOf<any, any>

  type FunctionsDict = Record<Exclude<Keys, (typeof nonFunctionProperties)[number]>, any>
  const obj: FunctionsDict = {
    toBeAny: fn,
    toBeUnknown: fn,
    toBeNever: fn,
    toBeFunction: fn,
    toBeObject: fn,
    toBeArray: fn,
    toBeString: fn,
    toBeNumber: fn,
    toBeBoolean: fn,
    toBeSymbol: fn,
    toBeNull: fn,
    toBeUndefined: fn,
    toBeNullable: fn,
    toMatchTypeOf: fn,
    toEqualTypeOf: fn,
    toBeCallableWith: fn,
    parameter: expectTypeOf,
  }

  const getterProperties: readonly Keys[] = nonFunctionProperties
  getterProperties.forEach((prop: Keys) => Object.defineProperty(obj, prop, {get: () => expectTypeOf({})}))

  return obj as any
}

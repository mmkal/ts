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

export type Params<Actual> = Actual extends (...args: infer P) => any ? P : [never]

type MismatchArgs<B extends boolean, C extends boolean> = Eq<B, C> extends true ? [] : [never]
export interface ExpectTypeOf<Actual, B extends boolean> {
  toBeAny: (...MISMATCH: MismatchArgs<IsAny<Actual>, B>) => true
  toBeUnknown: (...MISMATCH: MismatchArgs<IsUnknown<Actual>, B>) => true
  toBeNever: (...MISMATCH: MismatchArgs<IsNever<Actual>, B>) => true
  toMatchTypeOf: <Expected>(expected: Expected, ...MISMATCH: MismatchArgs<Extends<Actual, Expected>, B>) => true
  toEqualTypeOf: <Expected>(
    expected: Expected,
    ...MISMATCH: MismatchArgs<
      And<
        [
          Extends<Actual, Expected>,
          Extends<Expected, Actual>,
          Extends<keyof Actual, keyof Expected>,
          Extends<keyof Expected, keyof Actual>
        ]
      >,
      B
    >
  ) => true
  toBeCallableWith: B extends true ? ((...args: Params<Actual>) => true) : never
  parameter<K extends keyof Params<Actual>>(number: K): ExpectTypeOf<Params<Actual>[K], B>
  returns: Actual extends (...args: any[]) => infer R ? ExpectTypeOf<R, B> : never
  resolves: Actual extends PromiseLike<infer R> ? ExpectTypeOf<R, B> : never
  not: ExpectTypeOf<Actual, Not<B>>
}
const fn: any = () => true
export const expectTypeOf = <Actual>(actual: Actual): ExpectTypeOf<Actual, true> => {
  const obj = {
    toBeAny: fn,
    toBeUnknown: fn,
    toBeNever: fn,
    toMatchTypeOf: fn,
    toEqualTypeOf: fn,
    toBeCallableWith: fn,
    parameter: expectTypeOf,
  }
  const properties: Array<keyof ExpectTypeOf<any, true>> = ['returns', 'resolves', 'not']
  properties.forEach(prop => Object.defineProperty(obj, prop, {get: () => expectTypeOf({})}))
  return obj as any
}

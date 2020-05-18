type Func<Args = any[], T = any> = Args extends any[] ? (...args: Args) => T : never
type Head<A> = A extends any[] ? A[0] : never
type Tail<A> = Func<A> extends (head: any, ...rest: infer X) => any ? X : never
// avoid clash with @types/eslint
type _Prepend<A extends any[], X> = ((head: X, ...rest: A) => any) extends (...args: infer Args) => any ? Args : never
type Reverse<Tuple, Prefix extends any[] = []> = {
  0: Prefix
  1: Reverse<Tail<Tuple>, _Prepend<Prefix, Head<Tuple>>>
}[Tuple extends [any, ...any[]] ? 1 : 0]
type Append<A, X> = Reverse<_Prepend<Reverse<A>, X>>
type Concat<A, B> = {
  0: A
  1: Concat<Append<A, Head<B>>, Tail<B>>
}[B extends [any, ...any[]] ? 1 : 0]

type TakeWhile<A, C, Prefix extends any[] = []> = {
  0: Prefix;
  1: TakeWhile<Tail<A>, C, Reverse<_Prepend<Prefix, Head<A>>>>;
}[Head<A> extends C ? 1 : 0];

type DropWhile<A, C> = {
  0: A;
  1: DropWhile<Tail<A>, C>;
}[Head<A> extends C ? 1 : 0];

type Filter<A, C, Prefix extends any[] = []> = {
  0: Prefix;
  1: Filter<Tail<A>, C, Append<Prefix, Head<A>>>;
  2: Filter<Tail<A>, C, Prefix>;
}[A extends [] ? 0 : A extends [C, ...any[]] ? 1 : 2];

type Reject<A, C, Prefix extends any[] = []> = {
  0: Prefix;
  1: Reject<Tail<A>, C, Append<Prefix, Head<A>>>;
  2: Reject<Tail<A>, C, Prefix>;
}[A extends [] ? 0 : A extends [C, ...any[]] ? 2 : 1];

type Cast<T, U> = (T extends U ? (T & U) : never)

type Test = [
  Filter<[1, 2, 3, 4, 3, 2, 1], 1 | 2>,
  Reject<[1, 2, 3, 4, 3, 2, 1], 1 | 2>,
  'end', //
]

type Placeholder = '__placeholder'

type PlaceholderArgs<Args extends any[]> = {
  [K in keyof Args]: Args[K] | Placeholder
}

type PartialFuncParams<F extends Func> = PlaceholderArgs<Parameters<F>>

const f =  (x: number, y: string, z: boolean) => [x, y, z]

const funcify = <Params extends any[], Return>(f: (...args: Params) => Return) => {
  return {
    ppf: 1 as any as PlaceholderArgs<Params>,
    partialApply: <Args extends PlaceholderArgs<Params>>(...args: Args): Args => {
      // return [] as any
      return (...next: Cast<Reject<Args, Placeholder>, any[]>) => 1 as any
    }
  }
}

const y = funcify(f).ppf
const x = funcify(f).partialApply(1, '', '__placeholder')

// x.partialApply()

type Test2 = [PartialFuncParams<typeof f>]

const partialFuncify = <F extends (...args: any[]) => any>(func: F): {
  [K in keyof Parameters<F>]: Parameters<F>[K] | '_placeholder'
} => {
  return 1
}

const secret = Symbol('secret')
type Secret = typeof secret
type IsNever<T> = [T] extends [never] ? 1 : 0
type Not<T extends 0 | 1> = T extends 1 ? 0 : 1
type IsAny<T> = [T] extends [Secret] ? Not<IsNever<T>> : 0
type OneOf<T extends 1 | 0, U extends 1 | 0> = T extends 1 ? 1 : U
export type IsNeverOrAny<T> = OneOf<IsNever<T>, IsAny<T>>

export class RichError extends Error {
  private constructor(public details: unknown) {
    super(JSON.stringify(details, null, 2))
  }
  public static thrower(context: string) {
    return <T>(info?: T): never => RichError.throw({context, details: info})
  }
  public static throw<T>(details?: T): never {
    const resolvedDetails = details || {details: 'none!'}
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw Object.assign(new RichError(resolvedDetails), {details: resolvedDetails})
  }
}

export const funcLabel = (func: Function) =>
  func.name ||
  func
    .toString()
    .split('\n')
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .map(line => line.trim())
    .join(' ... ')

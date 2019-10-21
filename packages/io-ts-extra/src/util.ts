// stolen from mixed definition in https://www.npmjs.com/package/unknown-ts
type EverythingRealistic = {[key: string]: any} | object | number | string | boolean | symbol | undefined | null | void // tslint:disable-line max-line-length
type IsNever<T> = [T] extends [never] ? 1 : 0
type IsAnyOrUnknown<T> = IsNever<Exclude<T, EverythingRealistic>> extends 1 ? 0 : 1
type OneOf<T extends 1 | 0, U extends 1 | 0> = T extends 1 ? 1 : U
export type IsNeverOrAny<T> = OneOf<IsNever<T>, IsAnyOrUnknown<T>>

export class RichError extends Error {
  public static thrower(context: string) {
    return <T>(info?: T): never => RichError.throw({context, details: info})
  }
  public static throw<T>(details?: T): never {
    const resolvedDetails = details || {details: 'none!'}
    throw Object.assign(new RichError(resolvedDetails), {details: resolvedDetails})
  }
  private constructor(public details: unknown) {
    super(JSON.stringify(details, null, 2))
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

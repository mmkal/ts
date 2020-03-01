import {Type, union, Props, nullType, undefined as undefinedType, intersection, partial, type, mixed} from 'io-ts'
import * as t from 'io-ts'

export interface Optional {
  optional: true
}

/**
 * unions the passed-in type with `null` and `undefined`.
 * @see sparseType
 */
export const optional = <RT extends t.Mixed>(rt: RT, name?: string) => {
  const unionType = union([rt, nullType, undefinedType], name || rt.name + '?')
  return Object.assign(unionType, {optional: true} as Optional)
}

type OptionalPropsTypes<P extends Props> = {[K in keyof P]?: P[K]['_A']}
type OptionalPropsOutputs<P extends Props> = {[K in keyof P]?: P[K]['_O']}
type RequiredPropsKeys<P extends Props> = {[K in keyof P]: P[K] extends Optional ? never : K}[keyof P]
type RequiredPropsTypes<P extends Props> = {[K in RequiredPropsKeys<P>]: P[K]['_A']}
type RequiredPropsOutputs<P extends Props> = {[K in RequiredPropsKeys<P>]: P[K]['_O']}

/**
 * Can be used much like `t.type` from io-ts, but any property types wrapped with `optional` from
 * this package need not be supplied. Roughly equivalent to using `t.intersection` with `t.type` and `t.partial`.
 * @example
 * const Person = sparseType({
 *   name: t.string,
 *   age: optional(t.number),
 * })
 *
 * // no error - `age` is optional
 * const bob: typeof Person._A = { name: 'bob' }
 * @param props equivalent to the `props` passed into `t.type`
 * @returns a type with `props` field, so the result can be introspected similarly to a type built with
 * `t.type` or `t.partial` - which isn't the case if you manually use `t.intersection([t.type({...}), t.partial({...})])`
 */
export const sparseType = <P extends Props>(
  props: P,
  name?: string
): Type<OptionalPropsTypes<P> & RequiredPropsTypes<P>, OptionalPropsOutputs<P> & RequiredPropsOutputs<P>, mixed> & {
  props: P
} => {
  let someOptional = false
  let someRequired = false
  const optionalProps: Props = {}
  const requiredProps: Props = {}
  for (const key of Object.keys(props)) {
    const val: any = props[key]
    if (val.optional) {
      someOptional = true
      optionalProps[key] = val
    } else {
      someRequired = true
      requiredProps[key] = val
    }
  }
  const computedName = name || getInterfaceTypeName(props)
  if (someOptional && someRequired) {
    return Object.assign(intersection([type(requiredProps), partial(optionalProps)], computedName) as any, {props})
  } else if (someOptional) {
    return partial(props, computedName) as any
  } else {
    return type(props, computedName) as any
  }
}

const getNameFromProps = (props: Props): string =>
  Object.keys(props)
    .map(k => `${k}: ${props[k].name}`)
    .join(', ')

const getInterfaceTypeName = (props: Props): string => {
  return `{ ${getNameFromProps(props)} }`
}

/**
 * Validates that a value is an instance of a class using the `instanceof` operator
 * @example
 * const DateType = instanceOf(Date)
 * DateType.is(new Date())  // right(Date(...))
 * DateType.is('abc')       // left(...)
 */
export const instanceOf = <T>(cns: {new (...args: any[]): T}) =>
  new t.Type<T>(
    `InstanceOf<${cns.name || 'anonymous'}>`,
    (v): v is T => v instanceof cns,
    (s, c) => (s instanceof cns ? t.success(s) : t.failure(s, c)),
    t.identity
  )

/**
 * A refinement of `t.string` which validates that the input matches a regular expression.
 *
 * @example
 * const AllCaps = regex(/^[A-Z]*$/)
 * AllCaps.is('HELLO')  // right('HELLO')
 * AllCaps.is('hello')  // left(...)
 * AllCaps.is(123)      // left(...)
 */
export const regex = (pattern: string | RegExp, name?: string) => {
  const regexInstance = new RegExp(pattern)
  return t.refinement(t.string, value => regexInstance.test(value))
}

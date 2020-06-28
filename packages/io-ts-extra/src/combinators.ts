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
  }
  return type(props, computedName) as any
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
export const instanceOf = <T>(cns: new (...args: any[]) => T) =>
  new t.Type<T>(
    `InstanceOf<${cns.name || 'anonymous'}>`,
    (v): v is T => v instanceof cns,
    (s, c) => (s instanceof cns ? t.success(s) : t.failure(s, c)),
    t.identity
  )

/**
 * A type which validates its input as a string, then decodes with `String.prototype.match`,
 * succeeding with the RegExpMatchArray result if a match is found, and failing if no match is found.
 *
 * @example
 * const AllCaps = regexp(/\b([A-Z]+)\b/)
 * AllCaps.decode('HELLO')  // right([ 'HELLO', index: 0, input: 'HELLO' ])
 * AllCaps.decode('hello')  // left(...)
 * AllCaps.decode(123)      // left(...)
 */
export const regexp = (() => {
  const RegExpMatchArrayStructure = t.intersection([
    t.array(t.string),
    t.type({
      index: t.number,
      input: t.string,
    }),
  ])

  return (v: RegExp) => {
    const RegExpMatchArrayDecoder = new t.Type<typeof RegExpMatchArrayStructure._A, string, string>(
      `RegExp<${v.source}>`,
      RegExpMatchArrayStructure.is,
      (s, c) => RegExpMatchArrayStructure.validate(s.match(v), c),
      val => val.input
    )

    return t.string.pipe(RegExpMatchArrayDecoder)
  }
})()
export type RegExpCodec = ReturnType<typeof regexp>

/**
 * Like `t.type`, but fails when any properties not specified in `props` are defined.
 *
 * @example
 * const Person = strict({name: t.string, age: t.number})
 *
 * expectRight(Person.decode({name: 'Alice', age: 30}))
 * expectLeft(Person.decode({name: 'Bob', age: 30, unexpectedProp: 'abc'}))
 * expectRight(Person.decode({name: 'Bob', age: 30, unexpectedProp: undefined}))
 *
 * @param props dictionary of properties, same as the input to `t.type`
 * @param name optional type name
 *
 * @description
 * note:
 * - additional properties explicitly set to `undefined` _are_ permitted.
 * - internally, `sparseType` is used, so optional properties are supported.
 */
export const strict = <P extends Props>(props: P, name?: string) => {
  const codec = sparseType(props)
  return new t.Type<typeof codec._A, typeof codec._O>(
    name || `Strict<${codec.name}`,
    (val): val is typeof codec._A => codec.is(val) && Object.keys(val).every(k => k in props),
    (val, ctx) => {
      if (typeof val !== 'object' || !val) {
        return codec.validate(val, ctx)
      }
      const stricterProps = Object.keys(val).reduce<Props>(
        (acc, next) => ({...acc, [next]: props[next] || t.undefined}),
        {}
      )
      return sparseType(stricterProps as typeof props).validate(val, ctx)
    },
    codec.encode
  )
}

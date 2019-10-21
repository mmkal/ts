import {Type, union, Props, nullType, undefined as undefinedType, intersection, partial, type, mixed} from 'io-ts'
import * as t from 'io-ts'

interface Optional {
  optional: true
}

export const optional = <T>(rt: Type<T>, name?: string) => {
  const unionType = union([rt, nullType, undefinedType], name || rt.name + '?')
  return Object.assign(unionType, {optional: true} as Optional)
}

type OptionalPropsTypes<P extends Props> = {[K in keyof P]?: P[K]['_A']}
type OptionalPropsOutputs<P extends Props> = {[K in keyof P]?: P[K]['_O']}
type RequiredPropsKeys<P extends Props> = {[K in keyof P]: P[K] extends Optional ? never : K}[keyof P]
type RequiredPropsTypes<P extends Props> = {[K in RequiredPropsKeys<P>]: P[K]['_A']}
type RequiredPropsOutputs<P extends Props> = {[K in RequiredPropsKeys<P>]: P[K]['_O']}

export const sparseType = <P extends Props>(
  props: P,
  name?: string
): Type<OptionalPropsTypes<P> & RequiredPropsTypes<P>, OptionalPropsOutputs<P> & RequiredPropsOutputs<P>, mixed> => {
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
    return intersection([type(requiredProps), partial(optionalProps)], computedName) as any
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
export const instanceOf = <T>(cns: {new (...args: any[]): T}) =>
  new t.Type<T>(
    `InstanceOf<${cns.name || 'anonymous'}>`,
    (v): v is T => v instanceof cns,
    (s, c) => (s instanceof cns ? t.success(s) : t.failure(s, c)),
    t.identity
  )

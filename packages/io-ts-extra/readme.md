# io-ts-extra

Adds pattern matching, optional properties, and several other helpers and types, to io-ts.

<!-- codegen:start {preset: badges} -->
[![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)](https://github.com/mmkal/ts/actions?query=workflow%3A%22Node+CI%22)
[![codecov](https://codecov.io/gh/mmkal/ts/branch/main/graph/badge.svg)](https://codecov.io/gh/mmkal/ts/tree/main/packages/io-ts-extra)
[![npm version](https://badge.fury.io/js/io-ts-extra.svg)](https://npmjs.com/package/io-ts-extra)
<!-- codegen:end -->

## Features

* Pattern matching
* Optional properties
* Advanced refinement types
* Regex types
* Parser helpers

## Contents
<!-- codegen:start {preset: markdownTOC, minDepth: 2, maxDepth: 5} -->
- [Features](#features)
- [Contents](#contents)
- [Motivation](#motivation)
   - [Comparison with io-ts](#comparison-with-io-ts)
   - [Comparison with io-ts-types](#comparison-with-io-ts-types)
- [Documentation](#documentation)
   - [Pattern matching](#pattern-matching)
      - [match](#match)
      - [matcher](#matcher)
      - [Shorthand](#shorthand)
      - [codecFromShorthand](#codecfromshorthand)
   - [Codecs/Combinators](#codecscombinators)
      - [sparseType](#sparsetype)
      - [optional](#optional)
      - [mapper](#mapper)
      - [parser](#parser)
      - [strict](#strict)
      - [narrow](#narrow)
      - [validationErrors](#validationerrors)
      - [regexp](#regexp)
      - [instanceOf](#instanceof)
<!-- codegen:end -->


## Motivation

### Comparison with [io-ts](https://github.com/gcanti/io-ts)

The maintainers of io-ts are (rightly) strict about keeping the API surface small and manageable, and the implementation clean. As a result, io-ts is a powerful but somewhat low-level framework.

This library implements some higher-level concepts for use in real-life applications with complex requirements - combinators, utilities, parsers, reporters etc.

### Comparison with [io-ts-types](https://github.com/gcanti/io-ts-types)

io-ts-types exists for similar reasons. This library will aim to be orthogonal to io-ts-types, and avoid re-inventing the wheel by exposing types that already exist there.

io-ts-extra will also aim to provide more high-level utilities and combinators than pre-defined codecs.

Philosophically, this library will skew slightly more towards pragmatism at the expense of type soundness - for example the stance on [t.refinement vs t.brand](https://github.com/gcanti/io-ts/issues/373).

This package is also less mature. It's currently in v0, so will have a different release cadence than io-ts-types.

## Documentation

### Pattern matching

<!-- codegen:start {preset: markdownFromJsdoc, source: src/match.ts, export: match} -->
#### [match](./src/match.ts#L153)

Match an object against a number of cases. Loosely based on Scala's pattern matching.

##### Example

```typescript
// get a value which could be a string or a number:
const value = Math.random() < 0.5 ? 'foo' : Math.random() * 10
const stringified = match(value)
 .case(String, s => `the message is ${s}`)
 .case(7, () => 'exactly seven')
 .case(Number, n => `the number is ${n}`)
 .get()
```

Under the hood, io-ts is used for validation. The first argument can be a "shorthand" for a type, but you can also pass in io-ts codecs directly for more complex types:

##### Example

```typescript
// get a value which could be a string or a number:
const value = Math.random() < 0.5 ? 'foo' : 123
const stringified = match(value)
 .case(t.number, n => `the number is ${n}`)
 .case(t.string, s => `the message is ${s}`)
 .get()
```

you can use a predicate function or `t.refinement` for the equivalent of scala's `case x: Int if x > 2`:

##### Example

```typescript
// value which could be a string, or a real number in [0, 10):
const value = Math.random() < 0.5 ? 'foo' : Math.random() * 10
const stringified = match(value)
 .case(Number, n => n > 2, n => `big number: ${n}`)
 .case(Number, n => `small number: ${n}`)
 .default(x => `not a number: ${x}`)
 .get()
```

##### Example

```typescript
// value which could be a string, or a real number in [0, 10):
const value = Math.random() < 0.5 ? 'foo' : Math.random() * 10
const stringified = match(value)
 .case(t.refinement(t.number, n => n > 2), n => `big number: ${n}`)
 .case(t.number, n => `small number: ${n}`)
 .default(x => `not a number: ${x}`)
 .get()
```

note: when using predicates or `t.refinement`, the type being refined is not considered exhaustively matched, so you'll usually need to add a non-refined option, or you can also use `.default` as a fallback case (the equivalent of `.case(t.any, ...)`)

##### Params

|name|description                     |
|----|--------------------------------|
|obj |the object to be pattern-matched|
<!-- codegen:end -->

<!-- codegen:start {preset: markdownFromJsdoc, source: src/match.ts, export: matcher} -->
#### [matcher](./src/match.ts#L185)

Like @see match but no object is passed in when constructing the case statements. Instead `.get` is a function into which a value should be passed.

##### Example

```typescript
const Email = t.type({sender: t.string, subject: t.string, body: t.string})
const SMS = t.type({from: t.string, content: t.string})
const Message = t.union([Email, SMS])
type Message = typeof Message._A

const content = matcher<MessageType>()
  .case(SMS, s => s.content)
  .case(Email, e => e.subject + '\n\n' + e.body)
  .get({from: '123', content: 'hello'})

expect(content).toEqual('hello')
```

The function returned by `.get` is stateless and has no `this` context, you can store it in a variable and pass it around:

##### Example

```typescript
const getContent = matcher<Message>()
  .case(SMS, s => s.content)
  .case(Email, e => e.subject + '\n\n' + e.body)
  .get

const allMessages: Message[] = getAllMessages();
const contents = allMessages.map(getContent);
```
<!-- codegen:end -->


#### Shorthand

The "shorthand" format for type specifications maps to io-ts types as follows:

<!-- codegen:start {preset: markdownFromJsdoc, source: src/shorthand.ts, export: codecFromShorthand} -->
#### [codecFromShorthand](./src/shorthand.ts#L79)

Gets an io-ts codec from a shorthand input:

|shorthand|io-ts type|
|-|-|
|`String`, `Number`, `Boolean`|`t.string`, `t.number`, `t.boolean`|
|Literal raw strings, numbers and booleans e.g. `7` or `'foo'`|`t.literal(7)`, `t.literal('foo')` etc.|
|Regexes e.g. `/^foo/`|see [regexp](#regexp)|
|`null` and `undefined`|`t.null` and `t.undefined`|
|No input (_not_ the same as explicitly passing `undefined`)|`t.unknown`|
|Objects e.g. `{ foo: String, bar: { baz: Number } }`|`t.type(...)` e.g. `t.type({foo: t.string, bar: t.type({ baz: t.number }) })`
|`Array`|`t.unknownArray`|
|`Object`|`t.object`|
|One-element arrays e.g. `[String]`|`t.array(...)` e.g. `t.array(t.string)`|
|Tuples with explicit length e.g. `[2, [String, Number]]`|`t.tuple` e.g. `t.tuple([t.string, t.number])`|
|io-ts codecs|unchanged|
|Unions, intersections, partials, tuples with more than 3 elements, and other complex types|not supported, except by passing in an io-ts codec|
<!-- codegen:end -->

### Codecs/Combinators

<!-- codegen:start {preset: markdownFromJsdoc, source: src/combinators.ts, export: sparseType} -->
#### [sparseType](./src/combinators.ts#L40)

Can be used much like `t.type` from io-ts, but any property types wrapped with `optional` from this package need not be supplied. Roughly equivalent to using `t.intersection` with `t.type` and `t.partial`.

##### Example

```typescript
const Person = sparseType({
  name: t.string,
  age: optional(t.number),
})

// no error - `age` is optional
const bob: typeof Person._A = { name: 'bob' }
```

##### Params

|name |description                                   |
|-----|----------------------------------------------|
|props|equivalent to the `props` passed into `t.type`|

##### Returns

a type with `props` field, so the result can be introspected similarly to a type built with
`t.type` or `t.partial` - which isn't the case if you manually use `t.intersection([t.type({...}), t.partial({...})])`
<!-- codegen:end -->

<!-- codegen:start {preset: markdownFromJsdoc, source: src/combinators.ts, export: optional} -->
#### [optional](./src/combinators.ts#L14)

unions the passed-in type with `null` and `undefined`.
<!-- codegen:end -->

<!-- codegen:start {preset: markdownFromJsdoc, source: src/mapper.ts, export: mapper} -->
#### [mapper](./src/mapper.ts#L33)

A helper for building "parser-decoder" types - that is, types that validate an input, transform it into another type, and then validate the target type.

##### Example

```typescript
const StringsFromMixedArray = mapper(
  t.array(t.any),
  t.array(t.string),
  mixedArray => mixedArray.filter(value => typeof value === 'string')
)
StringsFromMixedArray.decode(['a', 1, 'b', 2]) // right(['a', 'b'])
StringsFromMixedArray.decode('not an array')   // left(...)
```

##### Params

|name |description                                    |
|-----|-----------------------------------------------|
|from |the expected type of input value               |
|to   |the expected type of the decoded value         |
|map  |transform (decode) a `from` type to a `to` type|
|unmap|transfrom a `to` type back to a `from` type    |
<!-- codegen:end -->


<!-- codegen:start {preset: markdownFromJsdoc, source: src/mapper.ts, export: parser} -->
#### [parser](./src/mapper.ts#L78)

A helper for parsing strings into other types. A wrapper around `mapper` where the `from` type is `t.string`.

##### Example

```typescript
const IntFromString = parser(t.Int, parseFloat)
IntFromString.decode('123')          // right(123)
IntFromString.decode('123.4')        // left(...)
IntFromString.decode('not a number') // left(...)
IntFromString.decode(123)            // left(...)
```

##### Params

|name  |description                                 |
|------|--------------------------------------------|
|type  |the target type                             |
|decode|transform a string into the target type     |
|encode|transform the target type back into a string|
<!-- codegen:end -->

<!-- codegen:start {preset: markdownFromJsdoc, source: src/combinators.ts, export: strict} -->
#### [strict](./src/combinators.ts#L159)

Like `t.type`, but fails when any properties not specified in `props` are defined.

##### Example

```typescript
const Person = strict({name: t.string, age: t.number})

expectRight(Person.decode({name: 'Alice', age: 30}))
expectLeft(Person.decode({name: 'Bob', age: 30, unexpectedProp: 'abc'}))
expectRight(Person.decode({name: 'Bob', age: 30, unexpectedProp: undefined}))
```

##### Params

|name |description                                            |
|-----|-------------------------------------------------------|
|props|dictionary of properties, same as the input to `t.type`|
|name |optional type name                                     |

note:
- additional properties explicitly set to `undefined` _are_ permitted.
- internally, `sparseType` is used, so optional properties are supported.
<!-- codegen:end -->


<!-- codegen:start {preset: markdownFromJsdoc, source: src/narrow.ts, export: narrow} -->
#### [narrow](./src/narrow.ts#L35)

Like io-ts's refinement type but:
1. Not deprecated (see https://github.com/gcanti/io-ts/issues/373)
2. Passes in `Context` to the predicate argument, so you can check parent key names etc.
3. Optionally allows returning another io-ts codec instead of a boolean for better error messages.

##### Example

```typescript
const CloudResources = narrow(
  t.type({
    database: t.type({username: t.string, password: t.string}),
    service: t.type({dbConnectionString: t.string}),
  }),
  ({database}) => t.type({
    service: t.type({dbConnectionString: t.literal(`${database.username}:${database.password}`)}),
  })
)

const valid = CloudResources.decode({
  database: {username: 'user', password: 'pass'},
  service: {dbConnectionString: 'user:pass'},
})
// returns a `Right`

const invalid = CloudResources.decode({
  database: {username: 'user', password: 'pass'},
  service: {dbConnectionString: 'user:wrongpassword'},
})
// returns a `Left` - service.dbConnectionString expected "user:pass", but got "user:wrongpassword"
```
<!-- codegen:end -->

<!-- codegen:start {preset: markdownFromJsdoc, source: src/reporters.ts, export: validationErrors} -->
#### [validationErrors](./src/reporters.ts#L11)

Similar to io-ts's PathReporter, but gives slightly less verbose output.

##### Params

|name      |description                                                                                                                         |
|----------|------------------------------------------------------------------------------------------------------------------------------------|
|validation|Usually the result of calling `.decode` with an io-ts codec.                                                                        |
|typeAlias |io-ts type names can be verbose. If the type you're using doesn't have a name,<br />you can use this to keep error messages shorter.|
<!-- codegen:end -->

<!-- codegen:start {preset: markdownFromJsdoc, source: src/combinators.ts, export: regexp} -->
#### [regexp](./src/combinators.ts#L103)

A type which validates its input as a string, then decodes with `String.prototype.match`, succeeding with the RegExpMatchArray result if a match is found, and failing if no match is found.

##### Example

```typescript
const AllCaps = regexp(/\b([A-Z]+)\b/)
AllCaps.decode('HELLO')  // right([ 'HELLO', index: 0, input: 'HELLO' ])
AllCaps.decode('hello')  // left(...)
AllCaps.decode(123)      // left(...)
```
<!-- codegen:end -->

<!-- codegen:start {preset: markdownFromJsdoc, source: src/combinators.ts, export: instanceOf} -->
#### [instanceOf](./src/combinators.ts#L85)

Validates that a value is an instance of a class using the `instanceof` operator

##### Example

```typescript
const DateType = instanceOf(Date)
DateType.is(new Date())  // right(Date(...))
DateType.is('abc')       // left(...)
```
<!-- codegen:end -->

# io-ts-extra

Some codecs and combinators not provided by io-ts or io-ts-types.

## Features

* Pattern matching
* Optional properties
* Advanced refinement types
* Regex types
* Parser helpers

## Contents
<!-- codegen:start {preset: md-toc, minDepth: 2, maxDepth: 5} -->
- [Features](#Features)
- [Contents](#Contents)
- [Motivation](#Motivation)
   - [Comparison with io-ts](#Comparison-with-io-ts)
   - [Comparison with io-ts-types](#Comparison-with-io-ts-types)
- [Documentation](#Documentation)
   - [Pattern matching](#Pattern-matching)
      - [match](#match)
      - [matcher](#matcher)
   - [Codecs/Combinators](#CodecsCombinators)
      - [sparseType](#sparseType)
      - [optional](#optional)
      - [mapper](#mapper)
      - [parser](#parser)
      - [refinement](#refinement)
      - [validationErrors](#validationErrors)
      - [regex](#regex)
      - [instanceOf](#instanceOf)
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

<!-- codegen:start {preset: jsdoc, module: src/match.ts, export: match} -->
#### [match](./src/match.ts#L115)

Match an object against a number of cases. Loosely based on Scala's pattern matching.

##### Example

```typescript
// get a value which could be a string or a number:
const value = Math.random() < 0.5 ? 'foo' : 123
const stringified = match(value)
 .case(t.number, n => `the number is ${n}`)
 .case(t.string, s => `the message is ${s}`)
 .get()
```

you can use `t.refinement` for the equivalent of scala's `case x: Int if x > 2`:

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

note: when using `t.refinement`, the type being refined is not considered as exhaustively matched, so you'll usually need to add a non-refined option, or you can also use `.default` as a fallback case (the equivalent of `.case(t.any, ...)`)

##### Params

|name|description|
|-|-|
|obj|the object to be pattern-matched|
<!-- codegen:end -->

<!-- codegen:start {preset: jsdoc, module: src/match.ts, export: matcher} -->
#### [matcher](./src/match.ts#L145)

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

### Codecs/Combinators

<!-- codegen:start {preset: jsdoc, module: src/combinators.ts, export: sparseType} -->
#### [sparseType](./src/combinators.ts#L38)

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

|name|description|
|-|-|
|props|equivalent to the `props` passed into `t.type`|

##### Returns

a type with `props` field, so the result can be introspected similarly to a type built with
`t.type` or `t.partial` - which isn't the case if you manually use `t.intersection([t.type({...}), t.partial({...})])`
<!-- codegen:end -->

<!-- codegen:start {preset: jsdoc, module: src/combinators.ts, export: optional} -->
#### [optional](./src/combinators.ts#L12)

unions the passed-in type with `null` and `undefined`.
<!-- codegen:end -->

<!-- codegen:start {preset: jsdoc, module: src/mapper.ts, export: mapper} -->
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

|name|description|
|-|-|
|from|the expected type of input value|
|to|the expected type of the decoded value|
|map|transform (decode) a `from` type to a `to` type|
|unmap|transfrom a `to` type back to a `from` type|
<!-- codegen:end -->


<!-- codegen:start {preset: jsdoc, module: src/mapper.ts, export: parser} -->
#### [parser](./src/mapper.ts#L72)

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

|name|description|
|-|-|
|type|the target type|
|decode|transform a string into the target type|
|encode|transform the target type back into a string|
<!-- codegen:end -->


<!-- codegen:start {preset: jsdoc, module: src/refinement.ts, export: refinement} -->
#### [refinement](./src/refinement.ts#L12)

Like io-ts's refinement type but:
1. Not deprecated (see https://github.com/gcanti/io-ts/issues/373)
2. Passes in `Context` to the predicate argument, so you can check parent key names etc.
3. Optionally allows returning another io-ts codec instead of a boolean for better error messages.
<!-- codegen:end -->

<!-- codegen:start {preset: jsdoc, module: src/reporters.ts, export: validationErrors} -->
#### [validationErrors](./src/reporters.ts#L10)

Similar to io-ts's PathReporter, but gives slightly less verbose output.

##### Params

|name|description|
|-|-|
|validation|Usually the result of calling `.decode` with an io-ts codec.|
|typeAlias|io-ts type names can be very verbose. If the type you're using doesn't have a name, you can use this to keep error messages shorter.|
<!-- codegen:end -->

<!-- codegen:start {preset: jsdoc, module: src/combinators.ts, export: regex} -->
#### [regex](./src/combinators.ts#L101)

A refinement of `t.string` which validates that the input matches a regular expression.

##### Example

```typescript
const AllCaps = regex(/^[A-Z]*$/)
AllCaps.decode('HELLO')  // right('HELLO')
AllCaps.decode('hello')  // left(...)
AllCaps.decode(123)      // left(...)
```
<!-- codegen:end -->

<!-- codegen:start {preset: jsdoc, module: src/combinators.ts, export: instanceOf} -->
#### [instanceOf](./src/combinators.ts#L84)

Validates that a value is an instance of a class using the `instanceof` operator

##### Example

```typescript
const DateType = instanceOf(Date)
DateType.is(new Date())  // right(Date(...))
DateType.is('abc')       // left(...)
```
<!-- codegen:end -->

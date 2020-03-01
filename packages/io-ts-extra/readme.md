# @mmkal/io-ts-extra

Some codecs and combinators not provided by io-ts or io-ts-types.

## Motivation

### Comparison with io-ts

The maintainers of io-ts are (rightly) strict about keeping the API surface small and manageable, and the implementation clean. As a result, io-ts is a powerful but somewhat low-level framework.

This library implements some higher-level concepts for use in real-life applications with complex requirements - combinators, utilities, parsers, reporters etc.

### Comparison with io-ts-types

The above motivations are presumably similar to the reasons for [io-ts-types](https://github.com/gcanti/io-ts-types) existing. This library will aim to be orthogonal to io-ts-types, and avoid re-inventing the wheel by exposing types that already exist there.

io-ts-extra will also aim to provide more high-level utilities and combinators than pre-defined codecs.

Philosophically, this library will skew slightly more towards pragmatism at the expensive of type soundness - for example the stance on [t.refinement vs t.brand](https://github.com/gcanti/io-ts/issues/373).

This package is also less mature. It's currently in v0, so will have a different release cadence than io-ts-types - as well as separate maintainers.

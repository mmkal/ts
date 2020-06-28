# ts

[![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)](https://github.com/mmkal/ts/actions?query=workflow%3A%22Node+CI%22)
[![codecov](https://codecov.io/gh/mmkal/ts/branch/master/graph/badge.svg)](https://codecov.io/gh/mmkal/ts)

Monorepo of assorted typescript projects.

## Packages

<!-- codegen:start {preset: monorepoTOC, sort: package.name} -->
- [eslint-plugin-codegen](https://github.com/mmkal/ts/tree/main/packages/eslint-plugin-codegen#readme) - An eslint plugin for inline codegen, with presets for barrels, jsdoc to markdown and a monorepo workspace table of contents generator. Auto-fixes out of sync code.
- [expect-type](https://github.com/mmkal/ts/tree/main/packages/expect-type#readme) - Compile-time tests for types. Useful to make sure types don't regress into being overly-permissive as changes go in over time.
- [fs-syncer](./packages/fs-syncer) - A helper to recursively read and write text files to a specified directory.
- [io-ts-extra](https://github.com/mmkal/ts/tree/main/packages/io-ts-extra#readme) - Adds pattern matching, optional properties, and several other helpers and types, to io-ts.
- [memorable-moniker](https://github.com/mmkal/ts/tree/main/packages/memorable-moniker#readme) - Name generator with some in-built dictionaries and presets.
<!-- codegen:end -->

<details>
<summary>Publishing - for maintainers</summary>

The below instructions only apply to maintainers of this repo - i.e. people with write permissions to npm and github for these packages. If you're not one of those people, feel free to ignore!

### Canary releases

GitHub Actions does a canary/prerelease publish for each package when commit messages include `/publish-canary`. The version is based on the commit date and hash, and the "dist-tag" is the branch name.

### Non-canary releases

These are done manually, via `yarn publish-packages`. To have permissions to run that, `~/.npmrc` needs to be configured for the npm package registry, meaning it needs a line like this:

```
//registry.npmjs.org/:_authToken=TOKEN
```

Where `TOKEN` is created from https://www.npmjs.com/settings/YOUR_USERNAME/tokens. For GitHub releases, a `GH_TOKEN` environment variables is needed - you can create one here: https://github.com/settings/tokens

### Previously - GitHub Packages

The old instructions for publishing to GitHub Packages' npm registry can be found here: https://github.com/mmkal/ts/tree/56bed6ba6c3fa7eca06c9f73adf104438e9b0f8a

</details>

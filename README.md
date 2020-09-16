# ts

[![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)](https://github.com/mmkal/ts/actions?query=workflow%3A%22Node+CI%22)
[![codecov](https://codecov.io/gh/mmkal/ts/branch/main/graph/badge.svg)](https://codecov.io/gh/mmkal/ts)

Monorepo of typescript projects.

## Packages

<!-- codegen:start {preset: monorepoTOC, sort: package.name} -->
- [eslint-plugin-codegen](https://github.com/mmkal/ts/tree/main/packages/eslint-plugin-codegen#readme) - An eslint plugin for inline codegen, with presets for barrels, jsdoc to markdown and a monorepo workspace table of contents generator. Auto-fixes out of sync code.
- [expect-type](https://github.com/mmkal/ts/tree/main/packages/expect-type#readme) - Compile-time tests for types. Useful to make sure types don't regress into being overly-permissive as changes go in over time.
- [fs-syncer](./packages/fs-syncer) - A helper to recursively read and write text files to a specified directory.
- [io-ts-extra](https://github.com/mmkal/ts/tree/main/packages/io-ts-extra#readme) - Adds pattern matching, optional properties, and several other helpers and types, to io-ts.
- [memorable-moniker](https://github.com/mmkal/ts/tree/main/packages/memorable-moniker#readme) - Name generator with some in-built dictionaries and presets.
<!-- codegen:end -->

### Development

Packages are managed using [rush](https://rushjs.io/pages/developer/new_developer/). Make sure rush is installed:

```bash
npm install --global @microsoft/rush
```

Then install, build, lint and test with:

```bash
rush update
rush build
rush lint
rush test
```

`rush update` should be run when updating the main branch too.

___

Add a dependency to a package (for example, adding lodash to fictional package in this monorepo `some-pkg`):

```bash
cd packages/some-pkg
rush add --package lodash
rush add --package @types/lodash --dev
```

You can also manually edit package.json then run `rush update`.

Create a new package:

```bash
cd packages
mkdir new-pkg
cd new-pkg
node ../../tools/node-pkg/init # sets up package.json, .eslintrc.js, tsconfig.json, jest.config.js
```

<!-- todo: make this step unnecessary -->
Then open `rush.json`, find the `projects` array, and adda new entry: `{ "packageName": "new-pkg", "projectFolder": "packages/new-pkg" }`

<details>
<summary>Publishing - for maintainers</summary>

### Previously

Old instructions:

- For creating canary releases: https://github.com/mmkal/ts/tree/fc5f2dd50a04439573bcfb1f4b7bf0cad59c1c59
- For publishing to GitHub Packages' npm registry: https://github.com/mmkal/ts/tree/56bed6ba6c3fa7eca06c9f73adf104438e9b0f8a

</details>

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
node ../../tools/rig/init # sets up package.json, .eslintrc.js, tsconfig.json, jest.config.js
```

<!-- todo: make this step unnecessary -->
Then open `rush.json`, find the `projects` array, and adda new entry: `{ "packageName": "new-pkg", "projectFolder": "packages/new-pkg" }`

### Publishing 
[![publish](https://github.com/mmkal/ts/workflows/publish/badge.svg)](https://github.com/mmkal/ts/actions/workflows/publish.yml)

Publishing is automated, but kicked off manually. The process is:

- Changes to published packages in this repo should be proposed in a pull request
- On every pull request, a [GitHub action](./.github/workflows/changes.yml) uses the `rush change` command to create a changefile:
  - the change is based on the PR title and body:
    - if the words "BREAKING CHANGE" appear anywhere, it's considered "major"
    - if the PR title starts with "chore", or "fix", it's considered a "patch"
    - otherwise, it's considered "minor"
  - the created changefile is pushed to the PR's branch, and a comment is left on the PR (example [PR](https://github.com/mmkal/ts/pull/166), [comment](https://github.com/mmkal/ts/pull/166#issuecomment-694554963) and [change](https://github.com/mmkal/ts/commit/8d8c442fdd54dc6732bf56e9a074afea58dc8303))
  - if the PR title or body is edited, or changes are pushed, the job will re-run and push a modification if necessary
  - most of the time, no change is necessary and the job exits after no-oping
  - if necessary, `rush change` can also be run locally to add additional messages - but ideally the PR title would be descriptive enough
  - the changefile should be merged in along with the rest of the changes

When a PR is merged, publishing is initiated by kicking off the [publish worfklow](https://github.com/mmkal/ts/actions/workflows/publish.yml):

- Clicking "Run workflow" will start another [GitHub action](./.github/workflows/publish.yml):
  - The workflow runs `rush publish`, which uses the changefiles merged with feature PRs, bumps versions and create git tags
  - When the publish step succeeds, a custom script reads the generated `CHANGELOG.json` files to create a GitHub release

<details>
<summary>Old instructions</summary>

Links to trees with previous iteration of publish instructions:

- For creating canary releases: https://github.com/mmkal/ts/tree/fc5f2dd50a04439573bcfb1f4b7bf0cad59c1c59
- For publishing to GitHub Packages' npm registry: https://github.com/mmkal/ts/tree/56bed6ba6c3fa7eca06c9f73adf104438e9b0f8a

</details>

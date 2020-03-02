# js

Assorted javascript projects, written in typescript.

## Packages

<!-- codegen:start {preset: workspaces} -->
1. [@mmkal/eslint-plugin-codegen](./packages/eslint-plugin-codegen) - An eslint plugin for inline codegen, with presets for barrels, jsdoc to markdown and a monorepo workspace table of contents generator. Auto-fixes out of sync code.
2. [@mmkal/expect-type](./packages/expect-type) - Compile-time tests for types. Useful to make sure types don't regress into being overly-permissive as changes go in over time.
3. [@mmkal/io-ts-extra](./packages/io-ts-extra) - Some codecs and combinators not provided by io-ts or io-ts-types.
4. [@mmkal/name-gen](./packages/name-gen) - Name generator with some in-built dictionaries and presets.
<!-- codegen:end -->

## Publishing

### Canary releases

Every commit to master triggers a canary/prerelease publish, for each package, to this repo's private github registry, via Github Actions. The name is based on the commit date and hash, and the "dist-tag" is the branch name (i.e. always master, but theoretically publishing could happen from another branch, and the dist-tag would be different).

### Non-canary releases

These are done manually, via `yarn publish-packages`. To have permissions to run that, `~/.npmrc` needs to be configured for your github account to interact with github's npm package registry, meaning it needs a line like this:

```
//npm.pkg.github.com/:_authToken=TOKEN
```

Where `TOKEN` is created from https://github.com/settings/tokens. See [this guide](https://dev.to/jgierer12/how-to-publish-packages-to-the-github-package-repository-4bai) for more details, or the [docs for Github Packages](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages).

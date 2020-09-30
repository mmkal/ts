# @mmkal/rig

A bundle with jest, eslint and tsconfig presets/dependencies/configs/passthrough bin scripts exposed.

These configs are very opinionated, and a work in progress. They make sense for me to use because I can change them at any time. They likely don't make sense for you to use, unless you are me.

Usage (note - these instructions assume you're using pnpm in a monorepo, but they should also work with a regular npm single-package repo. yarn/lerna monorepos with hoisting enabled may differ slightly, since hoisting means node_modules layout can vary):

```bash
pnpm install --save-dev @mmkal/rig
```

## package.json

Use the passthrough bin script `run` in package.json to access `tsc` and `eslint`:

```json5
{
  "scripts": {
    "build": "run tsc -p .",
    "lint": "run eslint --cache ."
  }
}
```

## .eslintrc.js

```js
module.exports = require('@mmkal/rig/.eslintrc')
```

## tsconfig.json

```json5
{
  "extends": "./node_modules/@mmkal/rig/tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/buildinfo.json",
    // convenient abstraction, however leaky: the helper package exposes node and jest types
    // but they're tucked away in a nested node_modules folder. This lets them be used
    "typeRoots": ["node_modules/@mmkal/rig/node_modules/@types"]
  },
  "exclude": ["node_modules", "dist"]
}
```

## jest.config.js

```js
module.exports = require('@mmkal/rig/jest.config')
```

## webpack.config.js

Webpack preferred over parcel. It's customisable (in most projects, intimidatingly so), but the rig package attempts to abstract that away as much as possible. This will give you a config for a bundled commonjs module:

```js
module.exports = require('@mmkal/rig/webpack.config').with(__filename)
```

That should be good as a serverless function entrypoint or similar. For web/a cli program, you'd have to use `...` to extend it. Or maybe, eventually this library should export a few different config options (while trying to avoid the inner platform effect).

# @mmkal/builder

A bundle with jest, eslint and tsconfig presets/dependencies/configs/passthrough bin scripts exposed.

Usage (note - these instructions assume you're using pnpm in a monorepo, but they should also work with a regular npm single-package repo. yarn/lerna monorepos with hoisting enabled may differ slightly, since hoisting means node_modules layout can vary):

```bash
pnpm install --save-dev @mmkal/builder
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
module.exports = require('@mmkal/builder/.eslintrc')
```

## tsconfig.json

```json5
{
  "extends": "./node_modules/@mmkal/builder/tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/buildinfo.json",
    // convenient abstraction, however leaky: the helper package exposes node and jest types
    // but they're tucked away in a nested node_modules folder. This lets them be used
    "typeRoots": ["node_modules/@mmkal/builder/node_modules/@types"]
  },
  "exclude": ["node_modules", "dist"]
}
```

## jest.config.js

```js
module.exports = require('@mmkal/builder/jest.config')
```

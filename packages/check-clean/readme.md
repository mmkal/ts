# check-clean

A cli tool to make sure you have no git changes.

## Usage

```bash
npx check-clean
```

___

You can also use `npm install --save-dev check-clean` and add an entry like `"check-clean": "check-clean"` to your package.json scripts section. If using yarn, `yarn add --dev check-clean` will enable `yarn check-clean` to be used even without a package.json script.

If you have local git changes, the command will exit with code 1 after printing something similar to the following:

```
error: git changes detected
check them in before running again
changes:
M path/to/changed/file.txt
```

If there are no changes, nothing is printed and the script will exit with code 0.

### API

You can also call it programmatically. Note, though, that it's designed to be run as a shell script, so by default will call `process.exit(1)` if there are changes. If that isn't what you want, [raise an issue](https://github.com/mmkal/ts/issues).

```bash
npm install check-clean
```

```js
const {checkClean} = require('check-clean')

checkClean()
```

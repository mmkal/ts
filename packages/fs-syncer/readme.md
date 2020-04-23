# fs-syncer

A helper to recursively read and write text files to a specified directory.

## The idea

It's a pain to write tests for tools that interact with the filesystem. It would be useful to write assertions that look something like:

```js
expect(someDirectory.read()).toEqual({
  'file1.txt': 'some info',
  'file2.log': 'something logged',
  nested: {
    sub: {
      directory: {
        'deeply-nested-file.sql': 'SELECT * FROM abc'
      },
    },
  },
})
```

Similarly, as part of test setup, you might want to write several files, e.g.:

```js
write({
  migrations: {
    'migration1.sql': 'create table one(id text)',
    'migration2.sql': 'create table two(id text)',
    down: {
      'migration1.sql': 'drop table one',
      'migration2.sql': 'drop table two',
    },
  },
})
```

The problem is that usually, you have to write a recursive directory-walker function, an object-to-filepath converter function, a nested-object-getter-function and a few more functions that tie them all together.

Then, if you have the energy, you should also write a function that cleans up any extraneous files after tests have been run. Or, you can pull in several dependencies that do some of these things for you, then write some functions that tie them together.

Now, you can just use `fs-syncer`, which does all of the above. Here's the API:

```js
import {fsSyncer} from 'fs-syncer'

const syncer = fsSyncer(__dirname + '/migrations', {
  'migration1.sql': 'create table one(id text)',
  'migration2.sql': 'create table two(id text)',
  down: {
    'migration1.sql': 'drop table one',
    'migration2.sql': 'drop table two',
  },
})

syncer.sync() // replaces all content in `./migrations` with what's described in the target state

syncer.read() // returns the filesystem state as an object, in the same format as the target state

// write a file that's not in part of the target state
require('fs').writeFileSync(__dirname + '/migrations/extraneous.txt', 'abc', 'utf8')

syncer.read() // includes `extraneous.txt: 'abc'`

syncer.sync() // 'extraneous.txt' will now have been removed

syncer.write() // like `syncer.sync()`, but doesn't remove extraneous files
```

## Not supported (right now)

- File content other than text, e.g. `Buffer`s. The library assumes you are solely dealing with utf8 strings.
- Any performance optimisations - you will probably have a bad time if you try to use it to read or write a very large number of files.
- Any custom symlink behaviour.

## Comparison with mock-fs

This isn't a mocking library. There's no magic under the hood, it just calls `fs.readFileSync`, `fs.writeFileSync` and `fs.mkdirSync` directly. Which means you can use it anywhere - it could even be a runtime dependency as a wrapper for the `fs` module. And using it doesn't have any weird side-effects like [breaking jest snapshot testing](https://www.npmjs.com/package/mock-fs#using-with-jest-snapshot-testing). Not being a mocking library means you could use it in combination with mock-fs, if you really wanted.

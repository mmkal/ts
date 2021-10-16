import {Volume} from 'memfs'
import {createFSSyncer} from '..'
import * as fs from 'fs'

test('can use memfs', () => {
  const vol = Volume.fromJSON({'root.txt': 'root'})
  const syncer = createFSSyncer({
    baseDir: 'this/should/not/be/created/on/the/real/filesystem',
    targetState: {'one.txt': '1'},
    fs: vol,
  })

  syncer.sync()

  expect(fs.existsSync(syncer.baseDir)).toBeFalsy()
  expect(vol.toJSON()).toMatchInlineSnapshot(`
    Object {
      "/Users/mkale/src/ts/packages/fs-syncer/root.txt": "root",
      "/Users/mkale/src/ts/packages/fs-syncer/this/should/not/be/created/on/the/real/filesystem/one.txt": "1
    ",
    }
  `)
})

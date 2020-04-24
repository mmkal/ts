import {fsSyncer} from '..'

import * as fs from 'fs'
import * as path from 'path'

test('sync', () => {
  const syncer = fsSyncer(path.join(__dirname, 'generated/sync'), {
    'a.txt': 'a',
    'b.txt': 'bee',
    c: {
      'd.txt': 'dee',
      'e.txt': 'ee',
      'f.txt': 'ef',
    },
  })

  syncer.sync()

  expect(syncer.read()).toMatchInlineSnapshot(`
    Object {
      "a.txt": "a",
      "b.txt": "bee",
      "c": Object {
        "d.txt": "dee",
        "e.txt": "ee",
        "f.txt": "ef",
      },
    }
  `)

  fs.writeFileSync(path.join(syncer.baseDir, 'unexpected.txt'), `shouldn't be here`, 'utf8')

  expect(syncer.read()).toMatchObject({'unexpected.txt': expect.any(String)})

  syncer.write()

  expect(syncer.read()).toMatchObject({'unexpected.txt': expect.any(String)})

  syncer.sync()

  expect(syncer.read()).toEqual(syncer.targetState)
  expect(syncer.read()).not.toHaveProperty('unexpected.txt')
})

test('creates base dir if necessary', () => {
  const syncer = fsSyncer(`${__dirname}/generated/create/${Math.random()}`, {})

  expect(fs.existsSync(syncer.baseDir)).toBe(false)
  expect(syncer.read()).toEqual({})

  syncer.sync()
  expect(syncer.read()).toEqual({})

  expect(fs.statSync(syncer.baseDir).isDirectory()).toBe(true)
})

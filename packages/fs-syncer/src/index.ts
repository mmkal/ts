import * as fs from 'fs'
import * as path from 'path'
import {getPaths, get} from './util'

/**
 * A helper to read and write text files to a specified directory.
 *
 * @param baseDir file paths relative to this
 * @param targetState a nested dictionary. A string property is a file, with the key
 * being the filename and the value the content. A nested object represents a directory.
 */
export const fsSyncer = <T extends object>(baseDir: string, targetState: T) => {
  const write = () => {
    fs.mkdirSync(baseDir, {recursive: true})
    const paths = getPaths(targetState)
    paths.forEach(p => {
      const filepath = path.join(baseDir, ...p)
      fs.mkdirSync(path.dirname(filepath), {recursive: true})
      fs.writeFileSync(filepath, `${get(targetState, p)}`)
    })
  }
  const readdir = (dir: string): object => {
    return fs.readdirSync(dir).reduce((s, p) => {
      const subpath = path.join(dir, p)
      return {
        ...s,
        [p]: fs.statSync(subpath).isFile() ? fs.readFileSync(subpath).toString() : readdir(subpath),
      }
    }, {})
  }
  const read = () => (fs.existsSync(baseDir) ? readdir(baseDir) : {})

  /** writes all target files to file system, and deletes files not in the target state object */
  const sync = () => {
    write()
    const fsState = read()
    const fsPaths = getPaths(fsState)
    fsPaths
      .filter(p => typeof get(targetState, p) === 'undefined')
      .forEach(p => fs.unlinkSync(path.join(baseDir, ...p)))
  }

  return {read, write, sync, targetState, baseDir}
}

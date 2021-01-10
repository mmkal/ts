import * as path from 'path'
import {yamlishPrinter} from './yaml'
import {createFSSyncer} from '.'

/**
 * @experimental
 * Call from a jest test to setup a syncer in a `baseDir` based on the current file, suite and test name.
 * This reduces the risk of copy-paste errors resulting in two tests trying to write to the same directory.
 * @param targetState target file tree
 */
// todo: give this the same signature as createFsSyncer
export const jestFixture = (targetState: object) => {
  return createFSSyncer<any>({
    baseDir: baseDir(),
    targetState,
  })
}

export const baseDir = () =>
  path.join(
    path.dirname(expect.getState().testPath),
    'fixtures',
    path.basename(expect.getState().testPath),
    expect
      .getState()
      .currentTestName.toLowerCase()
      .replace(/[^\da-z]/g, '-') // convert everything non-alphanumeric to dashes
      .replace(/-+/g, '-') // remove double-dashes
      .replace(/^-*/, '') // remove dashes at the start
      .replace(/-*$/, '') // remove dashes at the end
  )

export const wipe = () =>
  createFSSyncer({
    baseDir: path.join(path.dirname(expect.getState().testPath), 'fixtures'),
    targetState: {},
  }).sync()

import * as childProcess from 'child_process'
import {checkClean} from '..'

jest.mock('child_process')

const execSync = jest.spyOn(childProcess, 'execSync')

const logs = [] as any[]
const consoleInfo = jest.spyOn(console, 'info').mockImplementation((...args) => logs.push(['info', ...args]))
const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => logs.push(['error', ...args]))

beforeEach(() => {
  jest.clearAllMocks()
  logs.splice(0, logs.length)
})

test('checks using git status', () => {
  execSync.mockReturnValue(Buffer.from('\n'))
  const exit: any = jest.fn()

  checkClean({exit})

  expect(execSync).toHaveBeenCalledTimes(1)
  expect(execSync).toHaveBeenCalledWith('git status --porcelain')

  expect(exit).not.toHaveBeenCalled()
  expect(consoleInfo).not.toHaveBeenCalled()
  expect(consoleError).not.toHaveBeenCalled()
})

test('logs and exits with error code if there are changes', () => {
  execSync.mockReturnValue(Buffer.from('A some/file.txt'))
  const exit: any = jest.fn()

  checkClean({exit, ci: false})

  expect(exit).toHaveBeenCalledTimes(1)
  expect(exit).toHaveBeenCalledWith(1)

  expect(logs).toMatchInlineSnapshot(`
    Array [
      Array [
        "error",
        "[31merror: git changes detected",
      ],
      Array [
        "error",
        "[31mcheck them in before running again[0m",
      ],
      Array [
        "info",
        "[0mchanges:
    A some/file.txt",
      ],
    ]
  `)
})

test('logs and exits with error code if there are changes in CI', () => {
  execSync.mockReturnValue(Buffer.from('A some/file.txt'))
  const exit: any = jest.fn()

  checkClean({exit, ci: true})

  expect(exit).toHaveBeenCalledTimes(1)
  expect(exit).toHaveBeenCalledWith(1)

  expect(logs).toMatchInlineSnapshot(`
    Array [
      Array [
        "error",
        "[31merror: git changes detected",
      ],
      Array [
        "error",
        "[33mthis was run in a CI environment, you probably don't want changes to have been generated here. Try to reproduce this locally, and check the changes in before re-running in CI[0m",
      ],
      Array [
        "info",
        "[0mchanges:
    A some/file.txt",
      ],
    ]
  `)
})

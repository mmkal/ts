import * as childProcess from 'child_process'

jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue('\n'),
}))

test('requiring the cli module kicks off the script', () => {
  require('../cli')
  expect(childProcess.execSync).toHaveBeenCalledTimes(1)
  expect(childProcess.execSync).toHaveBeenCalledWith('git status --porcelain')
})

import * as childProcess from 'child_process'

const colours = {
  red: '\u001B[31m',
  yellow: '\u001B[33m',
  reset: '\u001B[0m',
}

export const checkClean = ({exit, env, argv} = process as Pick<typeof process, 'exit' | 'env' | 'argv'>) => {
  const gitStatus = childProcess.execSync('git status --porcelain').toString().trim()
  if (!gitStatus) {
    return
  }
  console.error(`${colours.red}error: git changes detected`)
  console.error(
    env.CI
      ? `${colours.yellow}this was run in a CI environment, you probably don't want changes to have been generated here. Try to reproduce this locally, and check the changes in before re-running in CI${colours.reset}`
      : `${colours.red}check them in before running again${colours.reset}`
  )

  if (argv[2]) {
    console.info(`${colours.reset}additional info: ${process.argv[2]}`)
  }
  console.info(`${colours.reset}changes:\n${gitStatus}`)
  exit(1)
}

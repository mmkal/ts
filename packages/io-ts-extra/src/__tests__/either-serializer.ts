import * as jsYaml from 'js-yaml'

expect.addSnapshotSerializer({
  test: val => val && (val._tag === 'Right' || val._tag === 'Left'),
  print: val => jsYaml.safeDump(val, {skipInvalid: true}).trim(),
})

import * as jsYaml from 'js-yaml'

expect.addSnapshotSerializer({
  test: val => val && (val._tag === 'Right' || val._tag === 'Left'),
  print: val => jsYaml.safeDump(val, {skipInvalid: true}).trim(),
})

export const expectLeft = (val: any) => {
  expect(val).toMatchObject({_tag: 'Left', left: expect.anything()})
  return expect(val)
}
export const expectRight = (val: any) => {
  expect(val).not.toMatchObject({_tag: 'Left', left: expect.anything()})
  expect(val).toMatchObject({_tag: 'Right', right: expect.anything()})
  return expect(val)
}

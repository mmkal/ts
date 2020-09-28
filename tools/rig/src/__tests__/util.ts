import * as jsYaml from 'js-yaml'

export const addYamlSerializer = () => {
  expect.addSnapshotSerializer({
    test: val => typeof val !== 'function',
    print: val => jsYaml.safeDump(val).trim(),
  })

  expect.addSnapshotSerializer({
    test: jest.isMockFunction,
    print: (val: any) => jsYaml.safeDump({mock: true, calls: val.mock.calls}).trim(),
  })
}

export type PartialMock<T> = {
  [K in keyof T]+?: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : T[K] extends Array<infer X>
    ? Array<PartialMock<X>>
    : T[K] extends string | boolean | number | symbol | bigint
    ? T[K]
    : PartialMock<T[K]>
}

export const buildMockParams = <Arg>(_fn: (...args: [Arg]) => unknown) => (partial: PartialMock<Arg>) =>
  partial as Arg & typeof partial

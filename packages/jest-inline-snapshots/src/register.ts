import {expectShim} from '.'

export const register = () => {
  const _global: {expect: typeof expect} = global as any
  const jestExpect = _global.expect

  _global.expect = Object.assign(
    (...args: Parameters<typeof expect>) => {
      const expecter = jestExpect(...args)
      expecter.toMatchInlineSnapshot = (...snapshotArgs: any[]) =>
        expectShim(...args).toMatchInlineSnapshot(...snapshotArgs)
      return expecter
    },
    jestExpect,
    {
      addSnapshotSerializer: (serializer: jest.SnapshotSerializerPlugin) => {
        jestExpect.addSnapshotSerializer(serializer)
        expectShim.addSnapshotSerializer(serializer as any)
      },
    }
  )

  return jestExpect
}

import * as t from 'io-ts'
import {collect, match, partialFunction} from '../match'
import {expectTypeOf} from '@mmkal/expect-type'

import './either-serializer'

describe('case matching', () => {
  const Cat = t.interface({miaow: t.string})
  const Dog = t.interface({bark: t.string})
  const Pet = t.union([Cat, Dog])
  type PetType = typeof Pet._A

  it('matches', () => {
    const sound = match({miaow: 'meow'} as PetType)
      .case(Dog, d => d.bark)
      .case(Cat, c => c.miaow)
      .get()

    expect(sound).toEqual('meow')
  })

  it('can use default', () => {
    const sound = match<PetType>({miaow: 'meow'})
      .case(Dog, d => d.bark)
      .default(JSON.stringify)
      .get()

    expect(sound).toEqual(`{"miaow":"meow"}`)
  })

  it('can build partial functions', () => {
    const sound = partialFunction<PetType>()
      .case(Dog, d => d.bark)
      .case(Cat, c => c.miaow)
      .get({miaow: 'meow'})

    expect(sound).toEqual('meow')
  })

  it('can refine', () => {
    const getSound = partialFunction<PetType>()
      .case(t.refinement(Cat, c => c.miaow.startsWith('m')), c => c.miaow)
      .case(Cat, c => 'not meow, but ' + c.miaow)
      .case(Dog, d => d.bark + ', ' + d.bark).get

    expectTypeOf(getSound)
      .parameter(0)
      .toEqualTypeOf({} as PetType)
    expectTypeOf(getSound).returns.toEqualTypeOf('')

    expect(getSound({miaow: 'meow'})).toEqual('meow')
    expect(getSound({miaow: 'woof'})).toEqual('not meow, but woof')
    expect(getSound({bark: 'ruff'})).toEqual('ruff, ruff')
  })

  it('uses default for partial function', () => {
    const number = partialFunction()
      .case(t.boolean, () => 123)
      .default(Number)
      .get('456')

    expect(number).toEqual(456)
  })

  it('throws when no match found', () => {
    const doubleNumber = partialFunction().case(t.number, n => n * 2).get

    expect(() => doubleNumber('hello' as any)).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"noMatchFoundFor\\": \\"hello\\",
  \\"types\\": [
    {
      \\"name\\": \\"number\\",
      \\"_tag\\": \\"NumberType\\"
    }
  ]
}"
`)
  })

  it('try get gives a left when no match found', () => {
    const doubleNumber = partialFunction().case(t.number, n => n * 2).tryGet

    expect(doubleNumber('hello' as any)).toMatchInlineSnapshot(`
      _tag: Left
      left:
        noMatchFoundFor: hello
        types:
          - name: number
            _tag: NumberType
    `)
  })

  it('try get gives a right when match is found', () => {
    const doubleNumber = partialFunction().case(t.number, n => n * 2).tryGet
    expect(doubleNumber(2)).toMatchInlineSnapshot(`
      _tag: Right
      right: 4
    `)
  })

  it('collects', () => {
    const Snake = t.interface({hiss: t.string})
    const Animal = t.union([Cat, Dog, Snake])
    type TAnimal = typeof Animal._A

    const animals: TAnimal[] = [{hiss: 'sss'}, {miaow: 'meow'}, {bark: 'woof'}]
    const petSounds = collect(
      animals,
      partialFunction()
        .case(Cat, c => c.miaow)
        .case(Dog, d => d.bark).tryGet
    )
    expect(petSounds).toMatchInlineSnapshot(`
      Array [
        "meow",
        "woof",
      ]
    `)
  })
})

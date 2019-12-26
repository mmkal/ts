import * as t from 'io-ts'
import {refinement} from '../refinement'
import {expectRight, expectLeft} from './either-serializer'
import {expectTypeOf} from '@mmkal/type-assertions'

it('refines', () => {
  const Person = t.type({name: t.string})
  const Family = t.type({
    members: t.record(
      t.string,
      refinement(Person, (val, ctx) => ctx.length === 0 || val.name === ctx[ctx.length - 1].key)
    ),
  })
  expectTypeOf(Family._A).toEqualTypeOf({} as {members: Record<string, {name: string}>})

  expectRight(Family.decode({members: {bob: {name: 'bob'}}}))
  expectLeft(Family.decode({members: {bob: {name: 'bib'}}}))
})

it('refines primitives', () => {
  const Family = t.type({
    members: t.record(
      t.string,
      t.type({
        name: refinement(t.string, (val, ctx) => {
          return ctx.length === 0 || val === ctx[ctx.length - 2].key
        }),
      })
    ),
  })

  expectRight(Family.decode({members: {bob: {name: 'bob'}}}))
  expectLeft(Family.decode({members: {bob: {name: 'bib'}}}))
})

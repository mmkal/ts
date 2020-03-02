import * as t from 'io-ts'
import {refinement} from '../refinement'
import {expectRight, expectLeft} from './either-serializer'
import {expectTypeOf} from 'expect-type'
import {validationErrors} from '../reporters'

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
          return ctx.length <= 2 || val === ctx[ctx.length - 2].key
        }),
      })
    ),
  })

  expectRight(Family.decode({members: {bob: {name: 'bob'}}}))
  expectLeft(Family.decode({members: {bob: {name: 'bib'}}}))
})

it('can refine with another codec', () => {
  const CloudResources = refinement(
    t.tuple([
      t.type({type: t.literal('database'), username: t.string, password: t.string}),
      t.type({type: t.literal('service'), databaseConnectionString: t.string}),
    ]),
    ([db]) =>
      t.tuple([
        t.any, // already validated
        t.type({databaseConnectionString: t.literal(`${db.username}:${db.password}`)}),
      ])
  )

  expectRight(
    CloudResources.decode([
      {type: 'database', username: 'user', password: 'pass'},
      {type: 'service', databaseConnectionString: 'user:pass'},
    ] as typeof CloudResources._A)
  )

  const invalidResources = CloudResources.decode([
    {type: 'database', username: 'user'}, // missing password
    {type: 'service', databaseConnectionString: 'user:pass'},
  ])
  expectLeft(invalidResources)
  expect(validationErrors(invalidResources, 'CloudResources')).toMatchInlineSnapshot(`
    Array [
      "Invalid value {undefined} supplied to CloudResources.0.password. Expected string.",
    ]
  `)

  const invalidConnectionString = CloudResources.decode([
    {type: 'database', username: 'user', password: 'pass'},
    {type: 'service', databaseConnectionString: 'user:typo'},
  ] as typeof CloudResources._A)
  expectLeft(invalidConnectionString)
  expect(validationErrors(invalidConnectionString, 'CloudResources')).toMatchInlineSnapshot(`
    Array [
      "Invalid value {'user:typo'} supplied to CloudResources.1.databaseConnectionString. Expected \\"user:pass\\".",
    ]
  `)
})

import * as t from 'io-ts'
import {narrow} from '../narrow'
import {expectRight, expectLeft} from './either-serializer'
import {expectTypeOf} from 'expect-type'
import {validationErrors} from '../reporters'

it('refines', () => {
  const Person = t.type({name: t.string})
  const Family = t.type({
    members: t.record(
      t.string,
      narrow(Person, (val, ctx) => ctx.length === 0 || val.name === ctx[ctx.length - 1].key)
    ),
  })
  expectTypeOf(Family._A).toEqualTypeOf<{members: Record<string, {name: string}>}>()

  expectRight(Family.decode({members: {bob: {name: 'bob'}}}))
  expectLeft(Family.decode({members: {bob: {name: 'bib'}}}))

  expect(Family.is({members: {bob: {name: 'bob'}}})).toBe(true)

  // note! only decode passes context to the predicate, so .is can have unexpected behaviour:
  expect(Family.is({members: {bob: {name: 'bib'}}})).toBe(true)
})

it('refines primitives', () => {
  const Family = t.type({
    members: t.record(
      t.string,
      t.type({
        name: narrow(t.string, (val, ctx) => {
          return ctx.length <= 2 || val === ctx[ctx.length - 2].key
        }),
      })
    ),
  })

  expectRight(Family.decode({members: {bob: {name: 'bob'}}}))
  expectLeft(Family.decode({members: {bob: {name: 'bib'}}}))
})

it('can refine with another codec', () => {
  const CloudResources = narrow(
    t.type({
      database: t.type({username: t.string, password: t.string}),
      service: t.type({dbConnectionString: t.string}),
    }),
    ({database}) => {
      expectTypeOf(database).toEqualTypeOf<{username: string; password: string}>()
      return t.type({
        service: t.type({dbConnectionString: t.literal(`${database.username}:${database.password}`)}),
      })
    }
  )

  expectRight(
    CloudResources.decode({
      database: {username: 'user', password: 'pass'},
      service: {dbConnectionString: 'user:pass'},
    } as typeof CloudResources._A)
  )

  expect(
    CloudResources.is({
      database: {username: 'user', password: 'pass'},
      service: {dbConnectionString: 'user:pass'},
    } as typeof CloudResources._A)
  ).toBe(true)

  const badResources = {
    database: {username: 'user'}, // missing password
    service: {dbConnectionString: 'user:pass'},
  }
  const badResourcesValidation = CloudResources.decode(badResources)
  expectLeft(badResourcesValidation)
  expect(CloudResources.is(badResources)).toBe(false)
  expect(validationErrors(badResourcesValidation, 'CloudResources')).toMatchInlineSnapshot(`
    Array [
      "Invalid value {undefined} supplied to CloudResources.database.password. Expected string.",
    ]
  `)

  const invalidConnectionString = CloudResources.decode({
    database: {username: 'user', password: 'pass'},
    service: {dbConnectionString: 'user:typo'},
  } as typeof CloudResources._A)
  expectLeft(invalidConnectionString)
  expect(validationErrors(invalidConnectionString, 'CloudResources')).toMatchInlineSnapshot(`
    Array [
      "Invalid value {'user:typo'} supplied to CloudResources.service.dbConnectionString. Expected \\"user:pass\\".",
    ]
  `)
})

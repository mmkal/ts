import * as t from 'io-ts'
import {collect, match, matcher} from '../match'
import {expectTypeOf} from 'expect-type'
import * as fp from 'lodash/fp'

import './either-serializer'

describe('case matching', () => {
  const Email = t.type({sender: t.string, subject: t.string, body: t.string})
  const SMS = t.type({from: t.string, content: t.string})
  const Message = t.union([Email, SMS])
  type MessageType = typeof Message._A

  it('matches', () => {
    const content = match({from: '123', content: 'hello'} as MessageType)
      .case(SMS, s => s.content)
      .case(Email, e => e.subject + '\n\n' + e.body)
      .get()

    expect(content).toEqual('hello')
  })

  it('can use shorthand', () => {
    const inputs = ['hi', {message: 'how are you'}, 'hello', 'bonjour', 37, [1, 2] as [number, number]]
    const content = inputs.map(i =>
      match(i)
        .case('hi', () => 'you just said hi')
        .case(String, fp.startsWith('h'), s => `greeting: ${s}`)
        .case(String, s => `custom greeting: ${s}`)
        .case({message: String}, m => {
          expectTypeOf(m).toEqualTypeOf<{message: string}>()
          return `you left a message: ${m.message}`
        })
        .case({message: {}}, m => `invalid message type: ${typeof m.message}`)
        .case(Number, n => `number: ${n}`)
        .case([Number, Number], ns => `two numbers: ${ns}`)
        .get()
    )

    expectTypeOf(content).items.toBeString()
    expect(content).toMatchInlineSnapshot(`
      Array [
        "you just said hi",
        "you left a message: how are you",
        "greeting: hello",
        "custom greeting: bonjour",
        "number: 37",
        "two numbers: 1,2",
      ]
    `)
  })

  it('can use shorthand with matcher', () => {
    const inputs = ['hi', 'hello', `what's going on`, 37]
    const content = inputs.map(
      matcher<typeof inputs[number]>()
        .case(String, fp.startsWith('h'), s => `greeting: ${s}`)
        .case(String, s => `custom message: ${s}`)
        .case(Number, n => `number: ${n}`).get
    )

    expect(content).toMatchInlineSnapshot(`
      Array [
        "greeting: hi",
        "greeting: hello",
        "custom message: what's going on",
        "number: 37",
      ]
    `)
  })

  it('can use shorthand with matcher + narrowing', () => {
    type PersonAttributes = {name: string; age: number}
    type Employee = PersonAttributes & {type: 'Employee'; employeeId: string}
    type Customer = PersonAttributes & {type: 'Customer'; orders: string[]}
    type Person = Employee | Customer

    matcher<Person>()
    // todo: enable these tests with typescript 3.9
    // .case({type: 'Employee'} as const, e => expectTypeOf(e.employeeId).toBeString())
    // .case({type: 'Customer'} as const, e => expectTypeOf(e.orders).toEqualTypeOf<string[]>())
  })

  it('can use default', () => {
    const sound = match<MessageType>({from: '123', content: 'hello'})
      .case(Email, e => e.body)
      .default(JSON.stringify)
      .get()

    expect(sound).toEqual(`{"from":"123","content":"hello"}`)
  })

  it('can build matchers', () => {
    const sound = matcher<MessageType>()
      .case(SMS, s => s.content)
      .case(Email, e => e.body)
      .get({from: '123', content: 'hello'})

    expect(sound).toEqual('hello')
  })

  it('can refine', () => {
    const getSenderType = matcher<MessageType>()
      .case(
        t.refinement(Email, e => e.sender.startsWith('mailing')),
        () => 'mailer'
      )
      .case(Email, e => 'personal contact: ' + e.sender)
      .case(SMS, s => s.from).get

    expectTypeOf(getSenderType)
      .parameter(0)
      .toEqualTypeOf({} as MessageType)
    expectTypeOf(getSenderType).returns.toEqualTypeOf('')

    expect(getSenderType({sender: 'mailing@abc.com', subject: 'hi', body: 'pls buy product'})).toEqual('mailer')
    expect(getSenderType({sender: 'bob@xyz.com', subject: 'hi', body: 'how are you'})).toEqual(
      'personal contact: bob@xyz.com'
    )
    expect(getSenderType({from: '+123', content: 'hello'})).toEqual('+123')
  })

  it('uses default for matcher', () => {
    const number = matcher()
      .case(t.boolean, () => 123)
      .default(Number)
      .get('456')

    expect(number).toEqual(456)
  })

  it('throws when no match found', () => {
    const doubleNumber = matcher().case(t.number, n => n * 2).get

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
    const doubleNumber = matcher().case(t.number, n => n * 2).tryGet

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
    const doubleNumber = matcher().case(t.number, n => n * 2).tryGet
    expect(doubleNumber(2)).toMatchInlineSnapshot(`
      _tag: Right
      right: 4
    `)
  })

  it('collects', () => {
    const VoiceMemo = t.type({recorder: t.string, link: t.string})
    const MixedMedia = t.union([Email, SMS, VoiceMemo])
    type MixedMedia = typeof MixedMedia._A

    const animals: MixedMedia[] = [
      {recorder: 'bob', link: 'voicememo.mp3'},
      {sender: 'a@b.com', subject: 'abc', body: 'email body'},
      {from: '+123', content: 'sms content'},
    ]
    const petSounds = collect(
      animals,
      matcher()
        .case(Email, e => e.body)
        .case(SMS, s => s.content).tryGet
    )
    expect(petSounds).toMatchInlineSnapshot(`
      Array [
        "email body",
        "sms content",
      ]
    `)
  })
})

describe('type-level tests', () => {
  test('match conditions narrow type', () => {
    const inputs = [{foo: 'bar'}, 123]

    const results = inputs.map(i =>
      match(i)
        .case(t.object, o => expectTypeOf(o).toEqualTypeOf({foo: 'bar'}))
        .case(t.number, n => expectTypeOf(n).toBeNumber())
        .get()
    )

    expectTypeOf(results).items.toEqualTypeOf<true>()
  })

  test(`match conditions don't narrow any or never`, () => {
    match({} as any).case(t.object, o => {
      expectTypeOf(o).not.toBeAny()
      expectTypeOf(o).toEqualTypeOf<object>()
    })
    match({} as never).case(t.object, o => {
      expectTypeOf(o).not.toBeAny()
      expectTypeOf(o).toEqualTypeOf<object>()
    })
  })

  test('matcher conditions narrow type', () => {
    const inputs = [{foo: 'bar'}, 123]

    const mapper = matcher<typeof inputs[number]>()
      .case(t.object, o => expectTypeOf(o).toEqualTypeOf({foo: 'bar'}))
      .case(t.number, n => expectTypeOf(n).toBeNumber())

    const results = inputs.map(mapper.get)

    expectTypeOf(results).items.toEqualTypeOf<true>()
  })

  test(`matcher conditions don't narrow any or never`, () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
    matcher<any>().case(t.object, o => {
      expectTypeOf(o).not.toBeAny()
      expectTypeOf(o).toEqualTypeOf<object>()
    })
    matcher<never>().case(t.object, o => {
      expectTypeOf(o).not.toBeAny()
      expectTypeOf(o).toEqualTypeOf<object>()
    })
  })
})

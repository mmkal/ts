import * as t from 'io-ts'
import {collect, match, matcher} from '../match'
import {expectTypeOf} from 'expect-type'

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

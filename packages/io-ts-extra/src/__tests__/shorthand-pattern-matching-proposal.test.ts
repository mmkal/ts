import {matcher, match} from '../match'

test('fetch response handling', () => {
  const {get: handler} = matcher()
    .case({status: 200, headers: {'Content-Length': Number}}, r => `size is ${r.headers['Content-Length']}`)
    .case({status: 404}, () => 'JSON not found')
    .case(
      {status: Number},
      r => r.status >= 400,
      r => {
        throw new Error(JSON.stringify(r))
      }
    )

  expect(handler({status: 200, headers: {'Content-Length': 123}})).toMatchInlineSnapshot(`"size is 123"`)

  expect(handler({status: 404})).toMatchInlineSnapshot(`"JSON not found"`)

  expect(() => handler({status: 401})).toThrowErrorMatchingInlineSnapshot(`"{\\"status\\":401}"`)
})

test('terse reducers', () => {
  type State = {visFilter?: {}; todos: Array<{text: string; done?: boolean}>}
  const reducer = (state: State, action: unknown) =>
    match(action)
      .case({type: 'set-visibility-filter', filter: String}, a => ({...state, visFilter: a.filter}))
      .case({type: 'add-todo', text: String}, a => ({...state, todos: [...state.todos, {text: a.text}]}))
      .case({type: 'toggle-todo', index: Number}, a => ({
        ...state,
        todos: state.todos.map((t, i) => (i === a.index ? {...t, done: !t.done} : t)),
      }))
      .default(() => state)
      .get()

  expect(reducer({todos: []}, {type: 'set-visibility-filter', filter: 'on'})).toMatchInlineSnapshot(`
    Object {
      "todos": Array [],
      "visFilter": "on",
    }
  `)

  expect(reducer({todos: []}, {type: 'add-todo', text: 'buy milk'})).toMatchInlineSnapshot(`
    Object {
      "todos": Array [
        Object {
          "text": "buy milk",
        },
      ],
    }
  `)

  expect(reducer({todos: [{text: 'buy milk'}, {text: 'hang picture'}]}, {type: 'toggle-todo', index: 1}))
    .toMatchInlineSnapshot(`
    Object {
      "todos": Array [
        Object {
          "text": "buy milk",
        },
        Object {
          "done": true,
          "text": "hang picture",
        },
      ],
    }
  `)
})

test('jsx props', () => {
  const {get: render} = matcher()
    .case({loading: {}}, () => `<Loading />`)
    .case({error: {}}, e => `<Error error=${e.error} />`)
    .case({data: {}}, p => `<Page data=${p.data} />`)

  expect(render({loading: true})).toMatchInlineSnapshot(`"<Loading />"`)

  expect(render({error: 'failed to fetch'})).toMatchInlineSnapshot(`"<Error error=failed to fetch />"`)

  expect(render({data: 'abc'})).toMatchInlineSnapshot(`"<Page data=abc />"`)
})

test('structural duck-typing', () => {
  const {get: getLength} = matcher()
    .case({x: Number, y: Number, z: Number}, v => Math.hypot(v.x, v.y, v.z))
    .case({x: Number, y: Number}, v => Math.hypot(v.x, v.y))
    .case([Number], v => v.length)

  expect(getLength({x: 3, y: 4, z: 5})).toMatchInlineSnapshot(`7.0710678118654755`)

  expect(getLength({x: 3, y: 4})).toMatchInlineSnapshot(`5`)

  expect(getLength([1, 2, 3, 4, 5, 6, 7])).toMatchInlineSnapshot(`7`)
})

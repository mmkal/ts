import {animals, people, women, men} from '..'

test('animals', () => {
  const generator = animals.modify(params => ({
    rng: params.rng.seed('animals'),
  }))
  expect(generator.next()).toMatchInlineSnapshot(`"superb-blacktip-reef-shark"`)
  expect(generator.next()).toMatchInlineSnapshot(`"worthy-potto"`)
  expect(generator.next()).toMatchInlineSnapshot(`"thankful-northern-right-whale"`)
  expect(generator.next()).toMatchInlineSnapshot(`"truthful-marbled-salamander"`)
  expect(generator.next()).toMatchInlineSnapshot(`"appreciative-black-footed-rhino"`)
})

test('women', () => {
  const generator = women.modify(params => ({
    rng: params.rng.seed('women'),
  }))
  expect(generator.next()).toMatchInlineSnapshot(`"Blair Brower"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Mae Carrasco"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Ellis Huntley"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Erika Thurston"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Jayleen Grantham"`)
})

test('men', () => {
  const generator = men.modify(params => ({
    rng: params.rng.seed('men'),
  }))
  expect(generator.next()).toMatchInlineSnapshot(`"Willie Schuler"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Vihaan Trahan"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Koa Aiken"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Maddux Thurston"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Taylor Farnsworth"`)
})

test('women and men', () => {
  const generator = people.modify(params => ({
    rng: params.rng.seed('people'),
  }))
  expect(generator.next()).toMatchInlineSnapshot(`"Legacy Couture"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Baylor Tinsley"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Opal Huston"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Ayaan Whatley"`)
  expect(generator.next()).toMatchInlineSnapshot(`"Joe Montanez"`)
})

test('animals with custom formatter', () => {
  const generator = animals.modify(params => ({
    rng: params.rng.seed('animals'),
    format: word => params.format(word).replace(/-/g, '_'),
    join: parts => ({joined: parts.join('.'), parts}),
  }))
  const result = generator.next()
  expect(result.joined.length).toBeGreaterThan(0)
  expect(result.parts.length).toBeGreaterThan(0)
  expect(result).toMatchInlineSnapshot(`
    Object {
      "joined": "superb.blacktip_reef_shark",
      "parts": Array [
        "superb",
        "blacktip_reef_shark",
      ],
    }
  `)
})

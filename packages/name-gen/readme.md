# name-gen

Name generator with some in-built dictionaries and presets.

## Usage

<!-- codegen:start {preset: regex, source: src/__tests__/index.test.ts, between: [test('nicknames', test], header: "import {nicknames} from 'name-gen'"} -->
```typescript
import {nicknames} from 'name-gen'

test('nicknames', () => {
  const generator = nicknames.modify(params => ({
    rng: params.rng.seed('nicknames'),
  }))
  const samples = [...Array(15)].map(() => generator.next())
  expect(samples).toMatchInlineSnapshot(`
    Array [
      "excited-goosander",
      "emphatic-sardine",
      "energetic-mosquito",
      "delightful-dog",
      "merry-hare",
      "praiseworthy-falcon",
      "amiable-curlew",
      "vigorous-pony",
      "fabulous-elephant-seal",
      "cheery-cobra",
      "respectable-heron",
      "comfortable-tamarin",
      "sincere-rabbit",
      "kind-mandrill",
      "extraordinary-pony",
    ]
  `)
})
```
<!-- codegen:end -->

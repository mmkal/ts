# memorable-moniker

Name generator with some in-built dictionaries and presets.

![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)
![codecov](https://codecov.io/gh/mmkal/ts/branch/master/graph/badge.svg)

## Documentation

### Installation

```bash
npm install memorable-moniker
```

or

```bash
yarn add memorable-moniker
```

### Usage

The package exports some pre-defined name generators, which have a `.modify(...)` function for customisation. The pre-defined generators are `nicknames`, `people`, `women` and `men`. They are exposed as named exports, e.g.:

```typescript
import { nicknames } from 'memorable-moniker'

// get a random nickname:
nicknames.next()
```

The `.modify` function allows tweaking the behavior of the generators. Here are some usage examples:

<!-- codegen:start {preset: markdownFromTests, source: src/__tests__/index.test.ts} -->
Nicknames/handles:

```typescript
const generator = nicknames.modify(params => ({
  rng: params.rng.seed('nicknames'),
}))
const samples = range(0, 15).map(() => generator.next())
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
```

Women's names:

```typescript
const generator = women.modify(params => ({
  rng: params.rng.seed('women'),
}))
const samples = range(0, 15).map(generator.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  "Blair Brower
  Mae Carrasco
  Ellis Huntley
  Erika Thurston
  Jayleen Grantham
  Harleigh Dent
  Jazlyn Lawler
  Cecelia Lipscomb
  Noa Durant
  Claudia Orourke
  Kyleigh Shah
  Dorothy Baer
  Adrianna Hirsch
  Kaydence Reardon
  Paulina Hudgins"
`)
```

Men's names:

```typescript
const generator = men.modify(params => ({
  rng: params.rng.seed('men'),
}))
const samples = range(0, 15).map(generator.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  "Willie Schuler
  Vihaan Trahan
  Koa Aiken
  Maddux Thurston
  Taylor Farnsworth
  Dax Pruett
  Alijah Lombardo
  Keagan Heck
  Kabir Burnham
  Judson Redding
  Koda Wakefield
  Keenan Pruett
  Kamden Burdick
  Jaxxon Mixon
  Orlando Smalls"
`)
```

Women's and men's names:

```typescript
const generator = people.modify(params => ({
  rng: params.rng.seed('people'),
}))
const samples = range(0, 15).map(generator.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  "Legacy Couture
  Baylor Tinsley
  Opal Huston
  Ayaan Whatley
  Joe Montanez
  Haylee Satterfield
  Marcellus Fugate
  Nathalie Reagan
  Oaklyn Merchant
  Kaelyn Thrasher
  Raul Caruso
  Lee Trahan
  Ryann Murry
  Uriel Greco
  Lucian Barksdale"
`)
```

Custom combination of built-in dictionaries:

```typescript
const doubleBarreledNames = people.modify(params => ({
  rng: params.rng.seed('double-barreled'),
  dictionaries: [['femaleName', 'maleName'], 'lastName', 'lastName'],
  join: parts => `${parts[0]} ${parts[1]}-${parts[2]}`,
}))
const samples = range(0, 15).map(doubleBarreledNames.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  "Tiana Denson-Dozier
  Leighton Escobedo-Ulrich
  Colson Saucedo-Shockley
  Monica Holton-Rooney
  Tristian Lyle-Huang
  Saint Monahan-Naylor
  Justus Boles-Gatlin
  Tristen Whatley-Schaeffer
  Royal Zepeda-Alonzo
  Kyleigh Satterfield-Jansen
  Dorothy Schwab-Ponder
  Addisyn Wilburn-Patten
  Yehuda Jacques-Joy
  Emory Beebe-Squires
  Esteban Mize-Barney"
`)
```

Use a custom dictionary:

```typescript
const generator = nicknames.modify(params => ({
  rng: params.rng.seed('coin'),
  dictionaries: [{words: ['heads', 'tails']}],
}))
const samples = range(0, 15).map(generator.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  "heads
  tails
  heads
  heads
  heads
  heads
  heads
  heads
  heads
  tails
  tails
  heads
  tails
  tails
  heads"
`)
```

Use a custom random number generator:

```typescript
const generator = nicknames.modify(params => ({
  rng: () => 0,
  dictionaries: [{words: ['heads', 'tails']}],
}))
const samples = range(0, 15).map(generator.next)
expect(samples).toEqual(range(0, 15).map(() => 'heads'))
```

Use a custom formatter to complex outputs:

```typescript
const generator = nicknames.modify(params => ({
  rng: params.rng.seed('animals'),
  format: word => params.format(word).replace(/-/g, '_'),
  join: parts => ({joined: parts.join('.'), parts}),
}))
const result = generator.next()
expectTypeOf(result).toEqualTypeOf<{joined: string; parts: string[]}>()
expect(result).toMatchInlineSnapshot(`
  Object {
    "joined": "superb.capybara",
    "parts": Array [
      "superb",
      "capybara",
    ],
  }
`)
```

full families:

```typescript
const generator = people.modify(params => {
  const rng = params.rng.seed('families')
  return {
    rng,
    dictionaries: ['lastName', 'lastName'],
    join: ([primaryLastName, secondaryLastName]) => {
      const size = 1 + Math.floor(rng() * 6)
      const firstNameGenerator = people.modify(params => ({
        rng: params.rng.seed(primaryLastName + secondaryLastName),
        dictionaries: [['femaleName', 'maleName']],
      }))
      expectTypeOf(firstNameGenerator.next).returns.not.toBeUnknown()
      expectTypeOf(firstNameGenerator.next).returns.toBeString()
      const primary = `${firstNameGenerator.next()} ${primaryLastName}`
      const secondary = `${firstNameGenerator.next()} ${rng() < 0.5 ? primaryLastName : secondaryLastName}`
      const kidNames = range(0, size).map(() => `${firstNameGenerator.next()} ${primaryLastName}`)
      return [primary, secondary, ...kidNames].slice(0, size)
    },
  }
})
const samples = range(0, 15).map(generator.next)
expect(samples).toMatchInlineSnapshot(`
  Array [
    Array [
      "Jenna Nesbitt",
      "Khalid Trimble",
      "Uriah Nesbitt",
      "Bianca Nesbitt",
      "Sutton Nesbitt",
    ],
    Array [
      "Kyleigh Corey",
      "Camilo Corey",
      "Braelynn Corey",
      "Adele Corey",
      "Monica Corey",
    ],
    Array [
      "Zaid Chester",
      "Kendall Layton",
      "Carmelo Chester",
      "Carl Chester",
    ],
    Array [
      "Kiana Etheridge",
      "Jaxtyn Beavers",
      "Amayah Etheridge",
      "Johanna Etheridge",
      "Harvey Etheridge",
    ],
    Array [
      "Yehuda Schuster",
      "Kyla Bowser",
      "Oakley Schuster",
    ],
    Array [
      "Miller Spain",
      "Ailani Boyles",
      "Rayna Spain",
    ],
    Array [
      "Kallie Monk",
      "Ignacio Adamson",
      "Kadence Monk",
    ],
    Array [
      "Karsyn Paris",
      "Zakai Paris",
    ],
    Array [
      "Conrad Levin",
      "Emmie Levin",
      "Kataleya Levin",
      "Kashton Levin",
      "Hugh Levin",
      "Alaric Levin",
    ],
    Array [
      "Rosalee Regan",
      "Zev Okeefe",
      "Esme Regan",
      "Zainab Regan",
    ],
    Array [
      "Milan Unger",
      "Raven Unger",
      "Miracle Unger",
      "Nataly Unger",
    ],
    Array [
      "Esmeralda Alonso",
    ],
    Array [
      "Michaela Wing",
      "Anne Wing",
    ],
    Array [
      "Aliza Radford",
      "Harleigh Fagan",
      "Lian Radford",
    ],
    Array [
      "Van Gannon",
      "Zaylee Ryder",
      "Leona Gannon",
      "Adrien Gannon",
      "Davion Gannon",
    ],
  ]
`)
```
<!-- codegen:end -->
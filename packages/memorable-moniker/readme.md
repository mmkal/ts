# memorable-moniker

Name generator with some in-built dictionaries and presets.

<!-- codegen:start {preset: badges} -->
[![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)](https://github.com/mmkal/ts/actions?query=workflow%3A%22Node+CI%22)
[![codecov](https://codecov.io/gh/mmkal/ts/branch/main/graph/badge.svg)](https://codecov.io/gh/mmkal/ts/tree/main/packages/memorable-moniker)
[![npm version](https://badge.fury.io/js/memorable-moniker.svg)](https://npmjs.com/package/memorable-moniker)
<!-- codegen:end -->

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
import {nicknames} from 'memorable-moniker'

// get a random nickname:
nicknames.next()
```

There are a few predefined name generators, which are exposed as named exports. Basic usage example, with sample outputs as comments:

```typescript
import {nicknames, women, men, people} from 'memorable-moniker'

nicknames.next()  // dynamic-capybara
women.next()      // Dani Snowden
men.next()        // Stanley Coronado
people.next()     // Javion Farrar
```

<!-- codegen:start {preset: markdownFromJsdoc, source: src/index.ts, export: nicknames} -->
#### [nicknames](./src/index.ts#L134)

The easiest way to get a name-generator is to import the `nicknames` generator and customise it as necessary. The `.modify(...)` method returns a new instance of a generator which extends the original. It receives a partial dictionary of parameters, or a function which returns one - the function receives the parent's configuration as an input. Parameters that can be modified:

**dictionaries** -- A list of "dictionaries" that words should be chosen from. These can be one of the preset values ('animal', 'femaleName', 'maleName', 'lastName', 'positiveAdjective'), or an object with a property called `words` which should be an array of strings. It's also possible to pass a list of dictionaries, in the same format. Some examples:

##### Example

```typescript
const animalGenerator = nicknames.modify({
  dictionaries: ['animal']
})
const formalAnimalGenerator = nicknames.modify({
  dictionaries: ['animal', 'lastName']
})
const veryFormalAnimalGenerator = nicknames.modify({
  dictionaries: [{words: ['Mr', 'Ms', 'Mrs']}, 'animal', 'lastName']
})
```

**rng** -- A random-number generator. A function that should return a value between 0 and 1. The lower bound should be inclusive and the upper bound exclusive. As a convenience, the default random-number generator has an `rng.seed('...')` function to allow getting a seeded rng based on the original. Usage:

##### Example

```typescript
const myNameGenerator = nicknames.modify(params => ({ rng: params.rng.seed('my-seed-value') }))
console.log(myNameGenerator.next()) // always returns the same value
```

**format** -- A function which transforms dictionary words before returning them from the generator. For example, you could convert from kebab-case to snake_case with:

##### Example

```typescript
const myGenerator = nicknames.modify({
  format: word => word.replace(/-/g, '_')
})
```

**choose** -- A function which receives a list of words, and a random-number generator function, and should return a single word. Typically this wouldn't need to be modified.

**join** -- A function which receives one word from each dictionary, and is responsible for joining them into a single value. Usually the return value is a string, but if another format is returned the type will be correctly inferred.

##### Example

```typescript
const informalPeople = nicknames.modify({
  dictionaries: [['maleName', 'femaleName'], 'lastName']
  join: (firstName, lastName) => `${firstName} ${lastName}`,
})
const formalPeople = nicknames.modify({
  dictionaries: [['maleName', 'femaleName'], 'lastName']
  join: (firstName, lastName) => `${lastName}, ${firstName}`,
})
const structuredPeople = nicknames.modify({
  dictionaries: [['maleName', 'femaleName'], 'lastName']
  join: (firstName, lastName) => ({ name: { first: firstName, last: lastName } }),
})
```
<!-- codegen:end -->

___

Some usage examples of the `.modify` function tweaking generator behavior:

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
const generator = nicknames.modify(() => ({
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
# memorable-moniker

Name generator with some in-built dictionaries and presets.

<!-- codegen:start {preset: badges} -->
[![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)](https://github.com/mmkal/ts/actions?query=workflow%3A%22Node+CI%22)
[![codecov](https://codecov.io/gh/mmkal/ts/branch/master/graph/badge.svg)](https://codecov.io/gh/mmkal/ts/tree/master/packages/memorable-moniker)
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

The `.modify` function allows tweaking the behavior of the generators. Here are some usage examples:

<!-- codegen:start {preset: markdownFromTests, source: src/__tests__/index.test.ts} -->
Nicknames/handles:

```typescript
const generator = nicknames.modify(params => ({
  rng: params.rng.seed('nicknames'),
}))
const samples = range(0, 15).map(() => generator.next())
expect(samples).toMatchInlineSnapshot([
  'excited-goosander',
  'emphatic-sardine',
  'energetic-mosquito',
  'delightful-dog',
  'merry-hare',
  'praiseworthy-falcon',
  'amiable-curlew',
  'vigorous-pony',
  'fabulous-elephant-seal',
  'cheery-cobra',
  'respectable-heron',
  'comfortable-tamarin',
  'sincere-rabbit',
  'kind-mandrill',
  'extraordinary-pony',
])
```

Women's names:

```typescript
const generator = women.modify(params => ({
  rng: params.rng.seed('women'),
}))
const samples = range(0, 15).map(generator.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  Blair Brower
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
  Paulina Hudgins
`)
```

Men's names:

```typescript
const generator = men.modify(params => ({
  rng: params.rng.seed('men'),
}))
const samples = range(0, 15).map(generator.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  Willie Schuler
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
  Orlando Smalls
`)
```

Women's and men's names:

```typescript
const generator = people.modify(params => ({
  rng: params.rng.seed('people'),
}))
const samples = range(0, 15).map(generator.next).join('\n')
expect(samples).toMatchInlineSnapshot(`
  Legacy Couture
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
  Lucian Barksdale
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
  Tiana Denson-Dozier
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
  Esteban Mize-Barney
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
  heads
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
  heads
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
expect(result).toMatchInlineSnapshot({
  joined: 'superb.capybara',
  parts: ['superb', 'capybara'],
})
```

full families:

```typescript
const generator = people.modify(params => {
  const rng = params.rng.seed('families')
  return {
    rng,
    dictionaries: ['lastName', 'lastName'],
    join: ([primaryLastName, secondaryBirthName]) => {
      const hasSecondary = rng() < 0.75

      const secondaryLastName = rng() < 0.5 ? primaryLastName : secondaryBirthName

      const kidLastName =
        !hasSecondary || secondaryLastName === primaryLastName
          ? primaryLastName
          : rng() < 0.5
          ? primaryLastName
          : `${primaryLastName}-${secondaryLastName}`

      const numKids = Math.floor(rng() * 4)

      const firstNameGenerator = people.modify(params => ({
        rng: params.rng.seed(primaryLastName + secondaryLastName),
        dictionaries: [['femaleName', 'maleName']],
      }))

      expectTypeOf(firstNameGenerator.next).returns.not.toBeUnknown()
      expectTypeOf(firstNameGenerator.next).returns.toBeString()

      return {
        primary: `${firstNameGenerator.next()} ${primaryLastName}`,
        secondary: hasSecondary ? `${firstNameGenerator.next()} ${secondaryLastName}` : undefined,
        kids: range(0, numKids).map(() => `${firstNameGenerator.next()} ${kidLastName}`),
      }
    },
  }
})
const samples = range(0, 15).map(generator.next)
expect(samples).toMatchInlineSnapshot([
  {
    primary: 'Jenna Nesbitt',
    secondary: 'Khalid Trimble',
    kids: ['Uriah Nesbitt', 'Bianca Nesbitt'],
  },
  {
    primary: 'Cairo Nowak',
    secondary: 'Thalia Nowak',
    kids: ['Tatum Nowak', 'Jaelynn Nowak'],
  },
  {
    primary: 'Haley Serna',
    secondary: 'Lailah Etheridge',
    kids: ['Maren Serna-Etheridge', 'Juelz Serna-Etheridge'],
  },
  {
    primary: 'Itzel Bowser',
    kids: [],
  },
  {
    primary: 'Mabel Pringle',
    secondary: 'Wallace Schreiber',
    kids: ['Arlette Pringle', 'Sam Pringle'],
  },
  {
    primary: 'Jada Paris',
    secondary: 'Corinne Paris',
    kids: ['Demi Paris', 'Karsyn Paris'],
  },
  {
    primary: 'Vicente Cavanaugh',
    secondary: 'Reuben Cavanaugh',
    kids: ['Ephraim Cavanaugh', 'Aubrielle Cavanaugh', 'Dane Cavanaugh'],
  },
  {
    primary: 'Maisie Pressley',
    kids: ['Maxine Pressley', 'Skyler Pressley'],
  },
  {
    primary: 'Vance Ruth',
    kids: [],
  },
  {
    primary: 'Aileen Wing',
    secondary: 'Jazmin Wing',
    kids: ['Keaton Wing', 'Aleah Wing'],
  },
  {
    primary: 'Coraline Fagan',
    secondary: 'Milena Stoner',
    kids: ['Maddux Fagan', 'Averi Fagan', 'Ailani Fagan'],
  },
  {
    primary: 'Davis Ridley',
    kids: ['Noa Ridley'],
  },
  {
    primary: 'Gunnar Gallardo',
    secondary: 'Kai Gallardo',
    kids: ['Marvin Gallardo'],
  },
  {
    primary: 'Damari Sorenson',
    secondary: 'Forrest Crisp',
    kids: ['Joyce Sorenson-Crisp', 'Colson Sorenson-Crisp'],
  },
  {
    primary: 'Etta Tang',
    secondary: 'Lucca Fontaine',
    kids: [],
  },
])
```
<!-- codegen:end -->
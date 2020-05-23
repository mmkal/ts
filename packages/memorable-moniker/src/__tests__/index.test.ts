import {nicknames, people, women, men} from '..'
import {range} from 'lodash'
import {expectTypeOf} from 'expect-type'

test('Nicknames/handles', () => {
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
})

test("Women's names", () => {
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
})

test("Men's names", () => {
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
})

test("Women's and men's names", () => {
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
})

test('Custom combination of built-in dictionaries', () => {
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
})

test('Use a custom dictionary', () => {
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
})

test('Use a custom random number generator', () => {
  const generator = nicknames.modify(() => ({
    rng: () => 0,
    dictionaries: [{words: ['heads', 'tails']}],
  }))
  const samples = range(0, 15).map(generator.next)
  expect(samples).toEqual(range(0, 15).map(() => 'heads'))
})

test('Use a custom formatter to complex outputs', () => {
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
})

test('full families', () => {
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
})

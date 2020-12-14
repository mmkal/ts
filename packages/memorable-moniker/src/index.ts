import seedrandom from 'seedrandom'

import * as dict from './dict'

// test
// test

export type WordList = keyof typeof dict
export type Dictionary = WordList | {words: string[]} | Dictionary[]

export interface Params<T> {
  dictionaries: Dictionary[]
  rng: Rng
  format: (word: string) => string
  choose: (params: {dict: string[]; rng: () => number}) => string
  join: (parts: string[]) => T
}

export type InputParams<T> =
  // prettier-ignore
  Partial<Omit<Params<T>, 'rng'> & {
    rng: () => number;
  }>

export interface NameGenerator<T> {
  params: Params<T>
  modify: <U = T>(changes: InputParams<U> | ((original: Params<T>) => InputParams<U>)) => NameGenerator<U>
  next: () => T
}

const resolveDictionaries = (dictionary: Dictionary): string[] => {
  if (typeof dictionary === 'string') {
    return dict[dictionary]
  }
  if (Array.isArray(dictionary)) {
    return ([] as string[]).concat(...dictionary.map(resolveDictionaries))
  }
  return dictionary.words
}

export type Rng = (() => number) & {seed: (seed: any) => Rng}
export const getRng = (seed?: string): Rng => Object.assign(seedrandom(seed), {seed: getRng})

export const createNameGenerator = <T>(params: Params<T>): NameGenerator<T> => {
  const wordLists = params.dictionaries.map(resolveDictionaries)
  const rng: Rng = Object.assign(
    () => {
      const num = params.rng()
      if (num >= 0 && num < 1) {
        return num
      }
      console.error(`rng should return a number in [0,1). got ${num}`)
      return Math.random()
    },
    {seed: getRng}
  )
  return {
    params,
    modify: changes => {
      const updated: any = typeof changes === 'function' ? changes(params) : changes
      return createNameGenerator({...params, ...updated})
    },
    next: () => params.join(wordLists.map(dict => params.choose({dict, rng})).map(params.format)),
  }
}

/**
 * The easiest way to get a name-generator is to import the `nicknames` generator and customise it as necessary.
 * The `.modify(...)` method returns a new instance of a generator which extends the original.
 * It receives a partial dictionary of parameters, or a function which returns one - the function receives the
 * parent's configuration as an input.
 *
 * Parameters that can be modified:
 *
 * @description **dictionaries** --
 *
 * A list of "dictionaries" that words should be chosen from. These can be one of the preset
 * values ('animal', 'femaleName', 'maleName', 'lastName', 'positiveAdjective'), or an object with a property
 * called `words` which should be an array of strings. It's also possible to pass a list of dictionaries, in the
 * same format. Some examples:
 *
 * @example
 * const animalGenerator = nicknames.modify({
 *   dictionaries: ['animal']
 * })
 * const formalAnimalGenerator = nicknames.modify({
 *   dictionaries: ['animal', 'lastName']
 * })
 * const veryFormalAnimalGenerator = nicknames.modify({
 *   dictionaries: [{words: ['Mr', 'Ms', 'Mrs']}, 'animal', 'lastName']
 * })
 *
 * @description **rng** --
 *
 * A random-number generator. A function that should return a value between 0 and 1. The lower bound
 * should be inclusive and the upper bound exclusive. As a convenience, the default random-number generator
 * has an `rng.seed('...')` function to allow getting a seeded rng based on the original. Usage:
 *
 * @example
 * const myNameGenerator = nicknames.modify(params => ({ rng: params.rng.seed('my-seed-value') }))
 * console.log(myNameGenerator.next()) // always returns the same value
 *
 * @description **format** --
 *
 * A function which transforms dictionary words before returning them from the generator. For example,
 * you could convert from kebab-case to snake_case with:
 *
 * @example
 * const myGenerator = nicknames.modify({
 *   format: word => word.replace(/-/g, '_')
 * })
 *
 * @description **choose** --
 *
 * A function which receives a list of words, and a random-number generator function, and should return
 * a single word. Typically this wouldn't need to be modified.
 *
 * @description **join** --
 *
 * A function which receives one word from each dictionary, and is responsible for joining them into a single
 * value. Usually the return value is a string, but if another format is returned the type will be correctly inferred.
 *
 * @example
 * const informalPeople = nicknames.modify({
 *   dictionaries: [['maleName', 'femaleName'], 'lastName']
 *   join: (firstName, lastName) => `${firstName} ${lastName}`,
 * })
 * const formalPeople = nicknames.modify({
 *   dictionaries: [['maleName', 'femaleName'], 'lastName']
 *   join: (firstName, lastName) => `${lastName}, ${firstName}`,
 * })
 * const structuredPeople = nicknames.modify({
 *   dictionaries: [['maleName', 'femaleName'], 'lastName']
 *   join: (firstName, lastName) => ({ name: { first: firstName, last: lastName } }),
 * })
 */
export const nicknames = createNameGenerator({
  dictionaries: ['positiveAdjective', 'animal'],
  // prettier-ignore
  format: x => x.toLowerCase().split(/\W/).filter(Boolean).join('-'),
  join: parts => parts.join('-'),
  rng: getRng(),
  choose: ({dict, rng}) => dict[Math.floor(rng() * dict.length)],
})

export const people = nicknames.modify({
  dictionaries: [['maleName', 'femaleName'], 'lastName'],
  format: x => x.slice(0, 1).toUpperCase() + x.slice(1),
  join: parts => parts.join(' '),
})

export const women = people.modify({
  dictionaries: ['femaleName', 'lastName'],
})

export const men = people.modify({
  dictionaries: ['maleName', 'lastName'],
})

import seedrandom from 'seedrandom'

import * as dict from './dict'

export type WordList = keyof typeof dict
export type Dictionary = WordList | {words: string[]} | Dictionary[]

export interface Params<T> {
  dictionaries: Dictionary[]
  format: (word: string) => string
  rng: Rng
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

export type Rng = {(): number} & {seed: (seed: any) => Rng}
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

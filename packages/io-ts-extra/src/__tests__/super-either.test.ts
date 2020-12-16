import * as fp from '../super-either';
import * as t from 'io-ts';

import * as A from 'fp-ts/lib/Apply';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import {E} from '../super-either';
import {pipe} from 'fp-ts/pipeable';
import {expectTypeOf} from 'expect-type';

test('sequence', async () => {
  const start = Date.now();
  const time = () => `${Math.floor((Date.now() - start) / 100)} ticks`;
  const sequential = await A.sequenceS(TE.taskEitherSeq)({
    x: T.delay(300)(async () => E.right(time())),
    y: T.delay(200)(async () => E.right(time())),
    z: T.delay(100)(async () => E.right(time())),
  })();

  expect(sequential).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "x": "3 ticks",
        "y": "5 ticks",
        "z": "6 ticks",
      },
    }
  `);
});

test('sequence parallel', async () => {
  const start = Date.now();
  const time = () => `${Math.floor((Date.now() - start) / 100)} ticks`;
  const parallel = await A.sequenceS(TE.taskEither)({
    x: T.delay(300)(async () => E.right(time())),
    y: T.delay(200)(async () => E.right(time())),
    z: T.delay(100)(async () => E.right(time())),
  })();

  expect(parallel).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "x": "3 ticks",
        "y": "2 ticks",
        "z": "1 ticks",
      },
    }
  `);
});

test('filterOrElse', () => {
  const filter = (num: number) =>
    pipe(
      E.right(num),
      E.filterOrElse(
        (n) => n >= 0,
        () => 'non-negative numbers not supported'
      )
    );
  expect(filter(1)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": 1,
    }
  `);
  expect(filter(-1)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": "non-negative numbers not supported",
    }
  `);
});

test('fromNullable', () => {
  const filter = (num?: number) => pipe(num, E.fromNullable('got nullable value'));
  expect(filter(1)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": 1,
    }
  `);
  expect(filter(undefined)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": "got nullable value",
    }
  `);
});

test('more realistic', async () => {
  const promisyClient = {
    getStringAsync: (input: string) => Promise.resolve(`${input},${input}`),
  };
  const taskEitherClient = {
    getString: (input: string): TE.TaskEither<Error, string> => TE.right(`${input}...${input}`),
  };

  const SomeCodec = t.type({
    name: t.string,
  });

  const result = await fp
    .start('somename')
    .map(promisyClient.getStringAsync)
    .chain(taskEitherClient.getString)
    .map((name: string) => ({name}))
    .chain(SomeCodec.decode)
    .mapLeft(fp.rethrow)
    .getSafe();

  expect(result).toMatchInlineSnapshot(`
    Object {
      "name": "somename,somename...somename,somename",
    }
  `);
});

test('redis es postgres', async () => {
  const es = {
    search: async (params: {before: Date, after: Date}) => {
      const docs = [
        {_id: 'one', _doc: {id: 'one', url: 'http://google.com', date: '2003'}},
        {_id: 'two', _doc: {id: 'two', url: 'http://bing.com', date: '2002'}},
      ]
      const [before, after] = [params.before, params.after].map(d => d.toISOString())

      return {
        total: 2,
        hits: docs.filter(d => d._doc.date < before && d._doc.date > after)
      }
    }
  }

  type EsQuery = Parameters<typeof es.search>[0]
  type Post = {url: string; text: string; title: string, date: string}

  const redis = {
    hydrate: async (params: {keys: string[]}) => {
      const store: NodeJS.Dict<Post> = {
        'one:http://google.com': {url: 'https://google.com', text: 'Search with google', title: 'Google', date: '2003'},
        'two:http://bing.com': {url: 'https://google.com', text: 'Search with bing', title: 'Bing', date: '2002'},
      }

      return params.keys.map(key => store[key as keyof typeof store]!).filter(Boolean)
    }
  }

  const postgres = {
    search: async (params: {before: Date; after: Date}) => {
      const db: Array<Post> = [
        {url: 'https://google.com', text: 'Search with google', title: 'Google', date: '2003'},
        {url: 'https://google.com', text: 'Search with bing', title: 'Bing', date: '2002'},
        {url: 'https://altavista.com', text: 'Search with altavista', title: 'Altavista', date: '2001'},
      ]

      const [before, after] = [params.before, params.after].map(d => d.toISOString())
      return db.filter(post => post.date < before && post.date > after)
    }
  }

  const getResult = (query: {range: string}) => fp
    .start(query)
    .map(q => q.range.split('-'))
    .map<EsQuery>(parts => ({before: new Date(parts[0]), after: new Date(parts[1])}))
    .into('query')
    .exec(console.log)
    .map(p => es.search(p.query))
    .map(esResults => redis.hydrate({keys: esResults.hits.map(h => h._id)}))
})

test('hle', async () => {
  const result = await fp
    .start('hello')
    .map((x) => ({greeting: x}))
    .chain((x) => fp.E.right(x.greeting.slice(1)))
    .chain((x) => fp.IOE.right(x.slice(0, 3)))
    .chain((sliced) => fp.TE.right([sliced, sliced]))
    .chain((x) => fp.IOE.right({x}))
    .value();

  expect(result).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "x": Array [
          "ell",
          "ell",
        ],
      },
    }
  `);

  const GreetingContainer = t.type({greeting: t.string});

  const s3Client = {
    get: async (n: number) => ({bucket: n.toString()}),
  };

  const maybeBucket = await fp
    .start(123)
    .tryMap('s3get', s3Client.get)
    // .chain((val) => tryCatchError(() => s3Client.get(val)))
    .value();

  const result2 = await fp
    .start('hello')
    .map(async (x) => ({greeting: x}))
    .chain(GreetingContainer.decode)
    .chain((x) => (x.greeting === 'hello' ? E.right(x) : E.left('bad greeting')))
    .strict.chain((x) => E.right(x.greeting.slice(1)))
    .chain((x) => fp.IOE.right(x.slice(0, 3)))
    .chain((sliced) => fp.TE.right([sliced, sliced]))
    .chain((x) => fp.IOE.right({x}))
    .mapValues((arr) => [...arr, ...arr])
    .chain((x) => (Math.random() ? E.right(x) : E.left(123)))
    .mapLeft((x) => [x])
    .map((y) => [y.x.length, y.x.length])
    .map((arr) => arr.filter((x) => x >= 2))
    .value();

  expect(result2).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Array [
        4,
        4,
      ],
    }
  `);
});

test('error recovery', async () => {
  type GoogleSearch = (query: string) => Promise<{results: string[]}>;

  const getSearchResults = (search: GoogleSearch) => (query: string) =>
    fp
      .start(query)
      .tryMap('googleSearch', search)
      .recover(
        (e) => e.tag === 'googleSearch',
        () => ({results: []})
      )
      .getTE();

  const goodSearch = getSearchResults((q) => Promise.resolve({results: [`result for ${q}`]}));
  const badSearch = getSearchResults(() => Promise.reject(Error('Google is down')));

  expect(await goodSearch('hello')()).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "results": Array [
          "result for hello",
        ],
      },
    }
  `);
  expect(await badSearch('hello')()).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "results": Array [],
      },
    }
  `);
});

test('recoverTruthy', async () => {
  type GoogleSearch = (query: string) => Promise<{results: string[]}>;

  const getSearchResults = (search: GoogleSearch) => (query: string) =>
    fp
      .start(query)
      .tryMap('googleSearch', search)
      .recoverTruthy((e) => e.tag === 'googleSearch' && {results: []})
      .value();

  const goodSearch = getSearchResults((q) => Promise.resolve({results: [`result for ${q}`]}));
  const badSearch = getSearchResults(() => Promise.reject(Error('Google is down')));

  expect(await goodSearch('hello')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "results": Array [
          "result for hello",
        ],
      },
    }
  `);
  expect(await badSearch('hello')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "results": Array [],
      },
    }
  `);
});

test('error recovery type inference', async () => {
  type GoogleSearch = (query: string) => Promise<{results: string[]}>;

  const getSearchResults = (search: GoogleSearch) => (query: string) =>
    fp
      .start(query)
      .tryMap('googleSearch', search)
      // @ts-expect-error (this test makes sure that e.tag is strongly-typed as `'googleSearch'`)
      .recoverTruthy((e) => e.tag === 'goggleSearch' && {results: []})
      .value();

  const badSearch = getSearchResults(() => Promise.reject(Error('Google is down')));
  expect(await badSearch('hello')).toBeLeft();
});

test('filter', async () => {
  const goodSearch = async (query: string) => ({results: [`result for ${query}`]});
  const badSearch = async () => ({results: []});

  const ok = await fp
    .start('hello')
    .map(goodSearch)
    .filter('nonEmptyResults', (r) => r.results.length)
    .value();

  const notok = await fp
    .start('hello')
    .map(badSearch)
    .filter('nonEmptyResults', (r) => r.results.length)
    .value();

  expect(ok).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "results": Array [
          "result for hello",
        ],
      },
    }
  `);

  expect(notok).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": [Error: filter returned false for {Object with keys: [results]} [tag: nonEmptyResults] [op: r => r.results.length]],
    }
  `);
});

test('strict chain', async () => {
  const getSearchResults = (query: string) =>
    fp
      .start(query)
      .tryMap('search', (q) => ({
        results: [`result for ${q}`],
      }))
      .getTE();

  const analyseSearchResults = (r: {results: string[]}) =>
    fp
      .start(r)
      .tryMap('analyse', ({results}) => ({
        analysis: results.map(({length}) => ({length})),
      }))
      .getTE();

  const ok = await fp
    .start('hello')
    .chain(getSearchResults) //
    .chain(analyseSearchResults)
    .value();

  const notok = await fp
    .start('hello')
    .chain(getSearchResults) //
    // @ts-expect-error - not allowed because of `.strict`. TaggedError<'analyse'> isn't assignable to TaggedError<'search'>
    // without strict we're allowed to do it, and we get a union left type of TaggedError<'analyse' | 'search'>
    .strict.chain(analyseSearchResults)
    .value();

  expect(ok).toEqual(notok);
});

test('strict recover', async () => {
  const getGoogleResults = async (query: string) => ({
    googleResults: [`result for ${query}`],
  });
  const getBingResults = async (query: string) => ({
    bingResults: [`result for ${query}`],
  });

  const ok = await fp
    .start('hello')
    .tryMap('search', getGoogleResults)
    .recover(
      (err) => err.tag === 'search',
      () => getBingResults('hello')
    )
    .getUnsafe('results');

  expectTypeOf(ok).toEqualTypeOf<{googleResults: string[]} | {bingResults: string[]}>()

  const notok = await fp
    .start('hello')
    .tryMap('search', getGoogleResults)
    .strict.recover(
      (err) => err.tag === 'search',
      // @ts-expect-error - bing results have a different format. using `.strict` disallows this.
      // without strict you get a union type
      () => getBingResults('hello')
    )
    .mapLeft(fp.rethrow)
    .getSafe();

  expect(ok).toEqual(notok);
});

test('use either module with chainEither', async () => {
  const folded = (input: string) =>
    fp
      .start(input)
      .filter('longerThan3', (s) => s.length > 3)
      .mapEither(
        E.fold(
          (err) => ({error: err.message}),
          (success) => ({error: 'none!', result: success})
        )
      )
      .getSafe();

  expect(await folded('ab')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "error": "filter returned false for {value with type string} [tag: longerThan3] [op: s => s.length > 3]",
      },
    }
  `);
  expect(await folded('abcd')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Object {
        "error": "none!",
        "result": "abcd",
      },
    }
  `);
});

test('swap lefts and rights, various ways', async () => {
  expect(
    await fp
      .start('somestring') // break
      .chainEither(E.swap)
      .value()
  ).toMatchInlineSnapshot(
    {_tag: 'Left'},
    `
    Object {
      "_tag": "Left",
      "left": "somestring",
    }
  `
  );

  expect(
    await fp
      .start('somestring') // break
      .chain(E.left)
      .value()
  ).toMatchInlineSnapshot(
    {_tag: 'Left'},
    `
    Object {
      "_tag": "Left",
      "left": "somestring",
    }
  `
  );

  expect(
    await fp
      .start('blah')
      .chain(E.left) // break
      .mapLeft(Error)
      .chainEither(E.swap)
      .value()
  ).toMatchInlineSnapshot(
    {_tag: 'Right'},
    `
    Object {
      "_tag": "Right",
      "right": [Error: blah],
    }
  `
  );

  expect(
    await fp
      .start('blah')
      .map(Error)
      .chain(E.left) // break
      .recoverTruthy((x) => x)
      .value()
  ).toMatchInlineSnapshot(
    {_tag: 'Right'},
    `
    Object {
      "_tag": "Right",
      "right": [Error: blah],
    }
  `
  );

  expect(
    await fp // break
      .start('blah')
      .map(Error)
      .chain(E.left)
      .orElse(E.right)
      .value()
  ).toMatchInlineSnapshot(
    {_tag: 'Right'},
    `
    Object {
      "_tag": "Right",
      "right": [Error: blah],
    }
  `
  );
});

test('get unsafely', async () => {
  await expect(fp.start(123).getUnsafe('isARightAsExpected')).resolves.toEqual(123);
  await expect(fp.start(123).chain(E.left).getUnsafe('isActuallyALeft')).rejects.toThrowErrorMatchingInlineSnapshot(
    `"value with type number [tag: isActuallyALeft] [op: getUnsafe]"`
  );
});

test('is lazy', async () => {
  const mock = jest.fn();
  const mockTask1 = fp.start(123).map(mock).value;
  const mockTask2 = fp.start(123).map(mock).getTE();

  expect(mock).not.toHaveBeenCalled();

  await Promise.all([mockTask1(), mockTask2()]);

  expect(mock).toHaveBeenCalledTimes(2);
});

test('get safely', async () => {
  await expect(fp.start(123).getSafe()).resolves.toEqual(123);
  await expect(fp.SuperTE.wrap(E.left(123)).orElse(E.right).getSafe()).resolves.toEqual(123);
  // @ts-expect-error
  await expect(fp.start(123).chain(E.left).getSafe()).rejects.toThrowErrorMatchingInlineSnapshot(
    `"value with type number [tag: expectedRight] [op: getUnsafe]"`
  );
  await expect(
    fp
      .start(1)
      .filter('gt2', (n) => n > 2)
      // @ts-expect-error
      .getSafe()
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"filter returned false for {value with type number} [tag: gt2] [op: n => n > 2] [tag: expectedRight] [op: getUnsafe]"`
  );
});

test('array helpers', async () => {
  const getSearchResults = async (q: string) => ({results: [`result for ${q}`]});

  const allResults = await fp
    .start(['abc', 'def'])
    .tryMapMany('searchList', (list) => list.map(getSearchResults))
    .flatMap((r) => r.results)
    .value();

  expect(allResults).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Array [
        "result for abc",
        "result for def",
      ],
    }
  `);

  const eachResults = await fp
    .start(['abc', 'def'])
    .tryMapEach('searchEach', getSearchResults)
    .flatMap((r) => r.results)
    .value();

  expect(eachResults).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": Array [
        "result for abc",
        "result for def",
      ],
    }
  `);
});

test('map struct', async () => {
  const googleSearch = async (q: string) => ({results: q.split('g')});
  const bingSearch = async (q: string) => ({results: q.split('b')});

  const betterSearchResults = (query: string) =>
    fp
      .start(query)
      .tryMapStruct('search', (q) => ({
        google: googleSearch(q),
        bing: bingSearch(q),
      }))
      .map((r) => (r.google.results.length > r.bing.results.length ? 'google' : 'bing'))
      .value();

  expect(await betterSearchResults('ggg')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": "google",
    }
  `);

  expect(await betterSearchResults('bbb')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": "bing",
    }
  `);
});

test('map struct error', async () => {
  const googleSearch = async (q: string) => ({results: q.split('g')});
  const bingSearch: typeof googleSearch = async (q) =>
    q.includes('b') ? {results: q.split('b')} : Promise.reject(Error('Failed to get search results'));

  const betterSearchResults = (query: string) =>
    fp
      .start(query)
      .tryMapStruct('search', (q) => ({
        google: googleSearch(q),
        bing: bingSearch(q),
      }))
      .map((r) => (r.google.results.length > r.bing.results.length ? `google` : 'bing'))
      .value();

  expect(await betterSearchResults('ggg')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": [Error: Failed to get search results [tag: bing] [op: [object Promise]] [tag: search] [op: q => ({ ... })]],
    }
  `);

  expect(await betterSearchResults('bbb')).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": "bing",
    }
  `);
});

test('truthy check', async () => {
  const filtered = <T>(val: T) =>
    fp // break
      .start(val)
      .filter('truthy', Boolean)
      .value();

  expect(await filtered(123)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": 123,
    }
  `);
  expect(await filtered(0)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": [Error: filter returned false for {value with type 0} [tag: truthy] [op: Boolean]],
    }
  `);
  expect(await filtered(false)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": [Error: filter returned false for {value with type false} [tag: truthy] [op: Boolean]],
    }
  `);
  expect(await filtered(null)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": [Error: filter returned false for {value with type null} [tag: truthy] [op: Boolean]],
    }
  `);
  expect(await filtered(undefined)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": [Error: filter returned false for {value with type undefined} [tag: truthy] [op: Boolean]],
    }
  `);
});

test('nullness check', async () => {
  const filtered = <T>(val: T) => fp.start(val).chain(E.fromNullable('got nullable value')).value();

  expect(await filtered(123)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": 123,
    }
  `);
  expect(await filtered(0)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": 0,
    }
  `);
  expect(await filtered(false)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Right",
      "right": false,
    }
  `);
  expect(await filtered(null)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": "got nullable value",
    }
  `);
  expect(await filtered(undefined)).toMatchInlineSnapshot(`
    Object {
      "_tag": "Left",
      "left": "got nullable value",
    }
  `);
});

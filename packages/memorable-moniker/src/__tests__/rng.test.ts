import {nicknames} from '..'
import {range} from 'lodash'

test('Invalid random-number generator fails gracefully', () => {
  jest.spyOn(console, 'error').mockReset()
  const generator = nicknames.modify({
    rng: () => 200,
  })

  range(0, 20).map(generator.next)
  expect(console.error).toHaveBeenCalled()
})

import Block from '@ipld/block/defaults.js'
import { CAR, load } from '../index.js'
import { deepStrictEqual as same } from 'assert'

export default async test => {
  test('load test.car manifest', async test => {
    const car = await load(Block, './test.car')
    test.after(() => car.close())

    const manifest = await car.manifest()
    same(Object.keys(manifest).length, 1137)
  })

  test('load w/ .all() and validate blocks', async test => {
    const car = await load(Block, './test.car')
    test.after(() => car.close())

    const getBlocks = []
    for await (const { getBlock } of car.all()) {
      getBlocks.push(getBlock)
    }
    await Promise.all(getBlocks.map(g => g().then(b => b.validate())))
  })
}

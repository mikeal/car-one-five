import Block from '@ipld/block/defaults.js'
import { CAR, load } from './index.js'

const run = async () => {
  const car = await load(Block, './test.car')
  const manifest = await car.manifest()
  console.log({manifest})
}
run()

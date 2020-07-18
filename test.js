import { read, open } from 'fs'
import Block from '@ipld/block/defaults.js'
import { CAR } from './index.js'

const _open = path => new Promise((resolve, reject) => {
  open(path, (e, fd) => {
    if (e) return reject(e)
    resolve(fd)
  })
})

const run = async () => {
  const fd = await _open('./test.car')
  console.log(fd)
  const _read = (pos, length) => {
    const b = Buffer.alloc(length)
    return new Promise((resolve, reject) => {
      read(fd, b, 0, length, pos, e => {
        if (e) return reject(e)
        resolve(b)
      })
    })
  }

  const car = new CAR({ Block, read: _read })

  const manifest = await car.manifest()
  console.log({manifest})
}
run()

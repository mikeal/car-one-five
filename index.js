import varints from 'varint'

const cache = new Map()

const varint = {
  decode: data => {
    const code = varints.decode(data)
    return [code, varints.decode.bytes]
  },
  encode: int => {
    if (cache.has(int)) return cache.get(int)
    const buff = Uint8Array.from(varints.encode(int))
    cache.set(int, buff)
    return buff
  }
}

const all = async function * (car) {
  if (car._parsing || car._parsed) {
    const manifest = await car.manifest
    for (const value of manifest.values()) {
      yield [value.cid, value.getBlock()]
    }
  } else {
    const parser = await car._parse()
    for await (const { cid, getBlock } of parser) {
      yield [cid, getBlock()]
    }
  }
}

const parse = async function * (car) {
  const { Block, read } = car

  let setManifest
  let setHeader
  car._manifest = new Promise(resolve => {
    setManifest = resolve
  })
  car._header = new Promise(resolve => {
    setHeader = resolve
  })

  let chunk = await read(0, 9) // 9 byte max varint size
  let [size, len] = varint.decode(chunk)
  chunk = await read(len, size)
  len += size

  const decode = Block.multiformats.get('dag-cbor').decode
  const header = decode(chunk)
  setHeader(header)
  console.log({header})

  const readLength = car.readLength || Infinity
  const manifest = {}

  let targetLength = 0

  while (len < readLength) {
    const start = len
    chunk = await read(len, targetLength) // read 3 varints
    let l = 0
    const [partSize, l0] = varint.decode(chunk)
    l += l0
    let [cidVersion, l1] = varint.decode(chunk.subarray(l))
    l += l1
    if (cidVersion < 5) {
      // CID Codec
      const [, l2] = varint.decode(chunk.subarray(l))
      l += l2
      // Multihash - Hash ID
      const [, l3] = varint.decode(chunk.subarray(l))
      l += l3
    } else {
      cidVersion = 0
    }

    // Multihash - Hash Length
    const [hashLength, l4] = varint.decode(chunk.subarray(l))
    l += l4
    if ((hashLength + l) > targetLength) {
      targetLength = hashLength + l
      chunk = await read(len, targetLength)
    }
    const dataStart = len + l + hashLength
    const dataLength = partSize - (l + hashLength)
    const cid = new Block.CID(chunk.subarray(l1, (l - l1) + hashLength))

    const getBlock = async () => {
      const data = await read(dataStart, dataLength)
      return Block.from(data, cid)
    }

    const entry = { cid, start, partSize, getBlock }
    manifest[cid.toString()] = entry
    yield entry
    len += partSize
  }

  car.parsing = false
  car.parsed = true
  setManifest(manifest)
}

const noop = () => {}

class CAR {
  constructor (opts) {
    const { store, read, Block, readLength } = opts
    this.Block = Block
    this.read = read
    this.store = store
    this.readLength = readLength
  }

  get isReader () {
    return !!this.read
  }

  get isWriter () {
    return !!this.store
  }

  _parse () {
    this._parsing = true
    this._parsed = false
    return parse(this)
  }

  async manifest () {
    if (this._parsing || this._parsed) return this._manifest
    for await (const p of this.all()) {
      noop(p)
    }
    return this._manifest
  }

  all () {
    return all(this)
  }
}

export { CAR /*, load, create */ }

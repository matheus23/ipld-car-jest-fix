/* eslint-env mocha */

import { fromBytes, fromIterable } from '@ipld/car/iterator'
import { carBytes, makeIterable, assert } from './common.js'
import {
  verifyRoots,
  verifyBlocks,
  verifyCids
} from './verify-store-reader.js'

describe('CarIterator fromBytes()', () => {
  it('blocks', async () => {
    const reader = await fromBytes(carBytes)
    await verifyRoots(reader)
    await verifyBlocks(reader)
  })

  it('cids', async () => {
    const reader = await fromBytes(carBytes)
    await verifyRoots(reader)
    await verifyCids(reader)
  })

  it('bad double blocks read', async () => {
    const reader = await fromBytes(carBytes)
    await verifyRoots(reader)
    await verifyBlocks(reader)
    await assert.isRejected(verifyBlocks(reader), /more than once/i)
  })

  it('bad double cids read', async () => {
    const reader = await fromBytes(carBytes)
    await verifyRoots(reader)
    await verifyCids(reader)
    await assert.isRejected(verifyCids(reader), /more than once/i)
  })

  it('bad blocks then cids read', async () => {
    const reader = await fromBytes(carBytes)
    await verifyRoots(reader)
    await verifyBlocks(reader)
    await assert.isRejected(verifyCids(reader), /more than once/i)
  })

  it('bad argument', async () => {
    for (const arg of [true, false, null, undefined, 'string', 100, { obj: 'nope' }]) {
      // @ts-ignore
      await assert.isRejected(fromBytes(arg))
    }
  })
})

describe('CarIterator.fromIterable()', () => {
  for (const chunkSize of [carBytes.length, 100, 64, 32]) {
    const chunkDesc = chunkSize === carBytes.length ? 'single chunk' : `${chunkSize}  bytes`

    it(`blocks (${chunkDesc})`, async () => {
      const reader = await fromIterable(makeIterable(carBytes, chunkSize))
      await verifyRoots(reader)
      await verifyBlocks(reader)
    })

    it(`cids (${chunkDesc})`, async () => {
      const reader = await fromIterable(makeIterable(carBytes, chunkSize))
      await verifyRoots(reader)
      await verifyCids(reader)
    })
  }

  it('bad argument', async () => {
    for (const arg of [new Uint8Array(0), true, false, null, undefined, 'string', 100, { obj: 'nope' }]) {
      // @ts-ignore
      await assert.isRejected(fromIterable(arg))
    }
  })
})

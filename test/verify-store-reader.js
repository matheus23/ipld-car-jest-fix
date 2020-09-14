import { assert, Block, makeData } from './common.js'

function compareBlockData (actual, expected, id) {
  assert.strictEqual(
    Block.multiformats.bytes.toHex(actual.encode()),
    Block.multiformats.bytes.toHex(expected.encode()),
    `comparing block as hex ${id}`
  )
}

function compareCids (actual, expected, id) {
  assert.strictEqual(actual.asCID, actual)
  assert.strictEqual(actual.toString(), expected.toString())
}

async function verifyRoots (reader) {
  // using toString() for now, backing buffers in Uint8Arrays are getting in the way
  // in the browser
  const { cborBlocks } = await makeData()

  const expected = [
    (await cborBlocks[0].cid()).toString(),
    (await cborBlocks[1].cid()).toString()
  ]
  assert.deepStrictEqual((await reader.getRoots()).map((c) => c.toString()), expected)
}

async function verifyHas (reader) {
  const { allBlocks } = await makeData()

  const verifyHas = async (cid, name) => {
    assert.ok(await reader.has(cid), `reader doesn't have expected key for ${name}`)
  }

  const verifyHasnt = async (cid, name) => {
    assert.ok(!(await reader.has(cid)), `reader has unexpected key for ${name}`)
    assert.strictEqual(await reader.get(cid), undefined)
  }

  for (const [type, blocks] of allBlocks) {
    for (let i = 0; i < blocks.length; i++) {
      await verifyHas(await blocks[i].cid(), `block #${i} (${type} / ${await blocks[i].cid()})`)
    }
  }

  // not a block we have
  await verifyHasnt(await Block.encoder(new TextEncoder().encode('dddd'), 'raw').cid(), 'dddd')
}

async function verifyGet (reader) {
  const { allBlocks } = await makeData()

  const verifyBlock = async (expected, index, type) => {
    let actual
    try {
      actual = await reader.get(await expected.cid())
    } catch (err) {
      assert.ifError(err, `get block length #${index} (${type})`)
    }
    compareBlockData(actual, expected, `#${index} (${type})`)
  }

  for (const [type, blocks] of allBlocks) {
    for (let i = 0; i < blocks.length; i++) {
      await verifyBlock(blocks[i], i, type)
    }
  }
}

async function verifyBlocks (reader, unordered) {
  const { allBlocksFlattened } = await makeData()
  if (!unordered) {
    const expected = allBlocksFlattened.slice()
    for await (const actual of reader.blocks()) {
      compareBlockData(actual, expected.shift())
    }
  } else {
    const expected = {}
    for (const block of allBlocksFlattened) {
      expected[(await block.cid()).toString()] = block
    }

    for await (const actual of reader.blocks()) {
      const cid = await actual.cid()
      const exp = expected[cid.toString()]
      if (!exp) {
        throw new Error(`Unexpected block: ${cid.toString()}`)
      }
      compareBlockData(actual, exp)
      delete expected[cid.toString()]
    }

    if (Object.keys(expected).length) {
      throw new Error('Did not find all expected blocks')
    }
  }
}

async function verifyCids (reader, unordered) {
  const { allBlocksFlattened } = await makeData()
  if (!unordered) {
    const expected = allBlocksFlattened.slice()
    for await (const actual of reader.cids()) {
      compareCids(actual, await expected.shift().cid())
    }
  } else {
    const expected = {}
    for (const block of allBlocksFlattened) {
      expected[(await block.cid()).toString()] = block
    }

    for await (const actual of reader.blocks()) {
      const cid = await actual.cid()
      const exp = expected[cid.toString()]
      if (!exp) {
        throw new Error(`Unexpected cid: ${cid.toString()}`)
      }
      delete expected[cid.toString()]
    }

    if (Object.keys(expected).length) {
      throw new Error('Did not find all expected cids')
    }
  }
}

export {
  verifyRoots,
  verifyHas,
  verifyGet,
  verifyBlocks,
  verifyCids
}
import {
  asyncIterableReader,
  bytesReader,
  createDecoder
} from './decoder.js'

/**
 * @typedef {import('multiformats').CID} CID
 * @typedef {import('../api').Block} Block
 * @typedef {import('../api').RootsReader} RootsReader
 * @typedef {import('../api').BlockIndex} BlockIndex
 * @typedef {import('../api').CarIndexer} CarIndexer
 * @typedef {import('./coding').BytesReader} BytesReader
 */

/**
 * @class
 * @implements {RootsReader}
 * @implements {CarIndexer}
 */
export default class Indexer {
  /**
   * @param {number} version
   * @param {CID[]} roots
   * @param {AsyncGenerator<BlockIndex>} iterator
   */
  constructor (version, roots, iterator) {
    Object.defineProperty(this, version, { writable: false, enumerable: true })
    this._roots = roots
    this._iterator = iterator
  }

  /**
   * @returns {Promise<CID[]>}
   */
  async getRoots () {
    return this._roots
  }

  /**
   * @returns {AsyncIterator<BlockIndex>}
   */
  [Symbol.asyncIterator] () {
    return this._iterator
  }

  /**
   * @param {Uint8Array} bytes
   * @returns {Promise<Indexer>}
   */
  static async fromBytes (bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('fromBytes() requires a Uint8Array')
    }
    return decodeIndexerComplete(bytesReader(bytes))
  }

  /**
   * @param {AsyncIterable<Uint8Array>} asyncIterable
   * @returns {Promise<Indexer>}
   */
  static async fromIterable (asyncIterable) {
    if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === 'function')) {
      throw new TypeError('fromIterable() requires an async iterable')
    }
    return decodeIndexerComplete(asyncIterableReader(asyncIterable))
  }
}

/**
 * @private
 * @param {BytesReader} reader
 * @returns {Promise<Indexer>}
 */
async function decodeIndexerComplete (reader) {
  const decoder = createDecoder(reader)
  const { version, roots } = await decoder.header()

  return new Indexer(version, roots, decoder.blocksIndex())
}
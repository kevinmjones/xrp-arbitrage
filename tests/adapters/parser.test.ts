import { describe, expect, it } from 'vitest'
import kraken from './fixtures/kraken-xrpusd.json'
import coinbase from './fixtures/coinbase-xrpusd.json'
import bitstamp from './fixtures/bitstamp-xrpusd.json'
import gemini from './fixtures/gemini-xrpusd.json'
import bitfinex from './fixtures/bitfinex-xrpusd.json'
import binance from './fixtures/binance-xrpusdt.json'
import okx from './fixtures/okx-xrpusdt.json'
import bybit from './fixtures/bybit-xrpusdt.json'
import { parseKrakenBook } from '../../src/adapters/kraken.ts'
import { parseCoinbaseBook } from '../../src/adapters/coinbase.ts'
import { parseBitstampBook } from '../../src/adapters/bitstamp.ts'
import { parseGeminiBook } from '../../src/adapters/gemini.ts'
import { parseBitfinexBook } from '../../src/adapters/bitfinex.ts'
import { parseBinanceBook } from '../../src/adapters/binance.ts'
import { parseOkxBook } from '../../src/adapters/okx.ts'
import { parseBybitBook } from '../../src/adapters/bybit.ts'

const expectedBids = [[2.5, 150], [2.49, 300]]
const expectedAsks = [[2.51, 100], [2.52, 200]]

describe('venue fixture parsers', () => {
  it.each([
    ['Kraken', () => parseKrakenBook(kraken, 'USD', 10)],
    ['Coinbase', () => parseCoinbaseBook(coinbase, 'USD', 10)],
    ['Bitstamp', () => parseBitstampBook(bitstamp, 'USD', 10)],
    ['Gemini', () => parseGeminiBook(gemini, 'USD', 10)],
    ['Bitfinex', () => parseBitfinexBook(bitfinex, 'USD', 10)],
    ['Binance', () => parseBinanceBook(binance, 'USDT', 10)],
    ['OKX', () => parseOkxBook(okx, 'USDT', 10)],
    ['Bybit', () => parseBybitBook(bybit, 'USDT', 10)],
  ])('normalizes %s books into canonical price/size levels', (_name, parse) => {
    const book = parse()
    expect(book.bids).toEqual(expectedBids)
    expect(book.asks).toEqual(expectedAsks)
    expect(book.venue).toBeTruthy()
    expect(book.fetchedAt).toBe(10)
  })
})

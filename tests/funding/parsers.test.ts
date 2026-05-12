import { describe, expect, it } from 'vitest'
import binancePremium from './fixtures/binance-xrpusdt-premium.json'
import okxFunding from './fixtures/okx-xrp-usdt-swap-funding.json'
import okxMark from './fixtures/okx-xrp-usdt-swap-mark.json'
import bybitTickers from './fixtures/bybit-xrpusdt-tickers.json'
import { parseBinancePremiumIndex } from '../../src/funding/adapters/binance-funding.ts'
import { parseOkxFundingRate, parseOkxMarkPrice, mergeOkxFundingAndMark } from '../../src/funding/adapters/okx-funding.ts'
import { parseBybitFundingTicker } from '../../src/funding/adapters/bybit-funding.ts'

const FETCHED_AT = 1716800001000

describe('Binance premiumIndex parser', () => {
  it('parses funding rate, mark/index, and next funding time', () => {
    const rate = parseBinancePremiumIndex(binancePremium, FETCHED_AT)
    expect(rate.venue).toBe('Binance')
    expect(rate.symbol).toBe('XRPUSDT')
    expect(rate.baseAsset).toBe('XRP')
    expect(rate.quoteAsset).toBe('USDT')
    expect(rate.fundingRate).toBeCloseTo(0.000125, 9)
    expect(rate.fundingIntervalHours).toBe(8)
    expect(rate.markPrice).toBeCloseTo(2.501, 6)
    expect(rate.indexPrice).toBeCloseTo(2.495, 6)
    expect(rate.nextFundingTime).toBe(1716816000000)
    expect(rate.fetchedAt).toBe(FETCHED_AT)
  })

  it('computes basis bps from mark and index', () => {
    const rate = parseBinancePremiumIndex(binancePremium, FETCHED_AT)
    expect(rate.basisBps).not.toBeNull()
    expect(rate.basisBps!).toBeCloseTo(((2.501 - 2.495) / 2.495) * 10_000, 4)
  })

  it('throws on missing fields', () => {
    expect(() => parseBinancePremiumIndex({}, FETCHED_AT)).toThrow()
  })
})

describe('OKX funding-rate parser', () => {
  it('parses funding rate and next funding time', () => {
    const rate = parseOkxFundingRate(okxFunding, FETCHED_AT)
    expect(rate.venue).toBe('OKX')
    expect(rate.symbol).toBe('XRP-USDT-SWAP')
    expect(rate.baseAsset).toBe('XRP')
    expect(rate.quoteAsset).toBe('USDT')
    expect(rate.fundingRate).toBeCloseTo(0.000098, 9)
    expect(rate.fundingIntervalHours).toBe(8)
    expect(rate.nextFundingTime).toBe(1716828800000)
    expect(rate.markPrice).toBeNull()
    expect(rate.indexPrice).toBeNull()
    expect(rate.basisBps).toBeNull()
    expect(rate.fetchedAt).toBe(FETCHED_AT)
  })

  it('rejects non-zero error code', () => {
    expect(() => parseOkxFundingRate({ code: '51001', msg: 'bad', data: [] }, FETCHED_AT)).toThrow(/OKX/)
  })

  it('mergeOkxFundingAndMark attaches mark price', () => {
    const rate = parseOkxFundingRate(okxFunding, FETCHED_AT)
    const mark = parseOkxMarkPrice(okxMark)
    const merged = mergeOkxFundingAndMark(rate, mark)
    expect(merged.markPrice).toBeCloseTo(2.5012, 6)
  })
})

describe('Bybit funding ticker parser', () => {
  it('parses funding rate, mark/index, and next funding time', () => {
    const rate = parseBybitFundingTicker(bybitTickers, FETCHED_AT)
    expect(rate.venue).toBe('Bybit')
    expect(rate.symbol).toBe('XRPUSDT')
    expect(rate.baseAsset).toBe('XRP')
    expect(rate.quoteAsset).toBe('USDT')
    expect(rate.fundingRate).toBeCloseTo(0.000075, 9)
    expect(rate.fundingIntervalHours).toBe(8)
    expect(rate.markPrice).toBeCloseTo(2.501, 6)
    expect(rate.indexPrice).toBeCloseTo(2.499, 6)
    expect(rate.nextFundingTime).toBe(1716828800000)
    expect(rate.basisBps).not.toBeNull()
    expect(rate.fetchedAt).toBe(FETCHED_AT)
  })

  it('rejects non-zero retCode', () => {
    expect(() => parseBybitFundingTicker({ retCode: 10001, retMsg: 'bad', result: { list: [] } }, FETCHED_AT)).toThrow(/Bybit/)
  })

  it('throws when list is empty', () => {
    expect(() => parseBybitFundingTicker({ retCode: 0, result: { list: [] } }, FETCHED_AT)).toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import type { OrderBook, Quote, VenueAdapter } from '../../src/types.ts'
import { fetchVenueBooks, getEnabledAdapters } from '../../src/adapters/index.ts'
import { isAdapterActive } from '../../src/lib/venues.ts'
import type { Config } from '../../src/types.ts'

const okBook: OrderBook = {
  venue: 'OK', symbol: 'XRP/USD', quote: 'USD', bids: [[2.5, 1]], asks: [[2.51, 1]], venueTs: null, fetchedAt: 1,
}

const okAdapter: VenueAdapter = {
  venue: 'OK', supportedQuotes: new Set<Quote>(['USD']), defaultMakerBps: 0, defaultTakerBps: 0, tier: 1,
  fetchBook: async () => okBook,
}
const failingAdapter: VenueAdapter = {
  venue: 'FAIL', supportedQuotes: new Set<Quote>(['USD']), defaultMakerBps: 0, defaultTakerBps: 0, tier: 1,
  fetchBook: async () => { throw new Error('network down') },
}

describe('adapter registry', () => {
  it('keeps Tier 2 global venues behind enableGlobalVenues', () => {
    expect(getEnabledAdapters({ enableGlobalVenues: false }).map((a) => a.venue)).toEqual([
      'Kraken', 'Coinbase', 'Bitstamp', 'Gemini', 'Bitfinex', 'Crypto.com', 'Binance.US',
    ])
    expect(getEnabledAdapters({ enableGlobalVenues: true }).map((a) => a.venue)).toContain('Binance')
    expect(getEnabledAdapters({ enableGlobalVenues: true }).map((a) => a.venue)).toContain('OKX')
    expect(getEnabledAdapters({ enableGlobalVenues: true }).map((a) => a.venue)).toContain('Bybit')
    expect(getEnabledAdapters({ enableGlobalVenues: true }).map((a) => a.venue)).toContain('Bitget')
  })

  it('keeps Tier 1 venues active while global venues are disabled', () => {
    const baseConfig: Config = {
      notionalUsd: 10_000,
      quote: 'USD',
      refreshIntervalMs: 5_000,
      staleMultiplier: 2,
      hideMultiplier: 4,
      topN: 10,
      enableGlobalVenues: false,
      fetchTimeoutMs: 4_000,
      proxyTimeoutMs: 8_000,
      selectedVenues: { Tier1Venue: true, GlobalTier2: true },
      feeOverridesBps: {},
    }
    expect(isAdapterActive({ ...okAdapter, venue: 'Tier1Venue', tier: 1 }, baseConfig)).toBe(true)
    expect(isAdapterActive({ ...okAdapter, venue: 'GlobalTier2', tier: 2 }, baseConfig)).toBe(false)
  })

  it('isolates adapter fetch failures and returns healthy books', async () => {
    const result = await fetchVenueBooks([okAdapter, failingAdapter], 'USD', new AbortController().signal)
    expect(result.books).toEqual([okBook])
    expect(result.errors).toEqual([{ venue: 'FAIL', message: 'network down' }])
  })
})

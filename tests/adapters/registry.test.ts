import { describe, expect, it } from 'vitest'
import type { OrderBook, Quote, VenueAdapter } from '../../src/types.ts'
import { fetchVenueBooks, getEnabledAdapters } from '../../src/adapters/index.ts'

const okBook: OrderBook = {
  venue: 'OK', symbol: 'XRP/USD', quote: 'USD', bids: [[2.5, 1]], asks: [[2.51, 1]], venueTs: null, fetchedAt: 1,
}

const okAdapter: VenueAdapter = {
  venue: 'OK', supportedQuotes: new Set<Quote>(['USD']), defaultMakerBps: 0, defaultTakerBps: 0, corsDirect: true,
  fetchBook: async () => okBook,
}
const failingAdapter: VenueAdapter = {
  venue: 'FAIL', supportedQuotes: new Set<Quote>(['USD']), defaultMakerBps: 0, defaultTakerBps: 0, corsDirect: true,
  fetchBook: async () => { throw new Error('network down') },
}

describe('adapter registry', () => {
  it('keeps Tier 2 global venues behind enableGlobalVenues', () => {
    expect(getEnabledAdapters({ enableGlobalVenues: false }).map((a) => a.venue)).toEqual([
      'Kraken', 'Coinbase', 'Bitstamp', 'Gemini', 'Bitfinex',
    ])
    expect(getEnabledAdapters({ enableGlobalVenues: true }).map((a) => a.venue)).toContain('Binance')
    expect(getEnabledAdapters({ enableGlobalVenues: true }).map((a) => a.venue)).toContain('OKX')
    expect(getEnabledAdapters({ enableGlobalVenues: true }).map((a) => a.venue)).toContain('Bybit')
  })

  it('isolates adapter fetch failures and returns healthy books', async () => {
    const result = await fetchVenueBooks([okAdapter, failingAdapter], 'USD', new AbortController().signal)
    expect(result.books).toEqual([okBook])
    expect(result.errors).toEqual([{ venue: 'FAIL', message: 'network down' }])
  })
})

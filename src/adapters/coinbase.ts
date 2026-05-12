import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USD', 'USDC', 'EUR'])
const PAIRS: Record<string, string> = { USD: 'XRP-USD', USDC: 'XRP-USDC', EUR: 'XRP-EUR' }
type CoinbaseBook = { asks: unknown[][], bids: unknown[][] }

export function parseCoinbaseBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as CoinbaseBook
  if (!Array.isArray(data.asks) || !Array.isArray(data.bids)) throw new Error('Coinbase response missing bids/asks')
  return sortBook({ venue: 'Coinbase', symbol: symbolFor(quote), quote, bids: normalizeLevels(data.bids), asks: normalizeLevels(data.asks), venueTs: null, fetchedAt })
}

export const coinbaseAdapter: VenueAdapter = {
  venue: 'Coinbase', supportedQuotes: SUPPORTED, defaultMakerBps: 60, defaultTakerBps: 120, tier: 1,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Coinbase', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api.exchange.coinbase.com/products/${PAIRS[quote]}/book?level=2`, signal, false)
    return parseCoinbaseBook(payload, quote, fetchedAt)
  },
}

export const parseCoinbase = parseCoinbaseBook

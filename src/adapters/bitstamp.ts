import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USD', 'USDT', 'USDC', 'EUR'])
const PAIRS: Record<Quote, string> = { USD: 'xrpusd', USDT: 'xrpusdt', USDC: 'xrpusdc', EUR: 'xrpeur' }
type BitstampBook = { asks: unknown[][], bids: unknown[][], microtimestamp?: string, timestamp?: string }

export function parseBitstampBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as BitstampBook
  if (!Array.isArray(data.asks) || !Array.isArray(data.bids)) throw new Error('Bitstamp response missing bids/asks')
  const venueTs = data.microtimestamp ? Math.trunc(Number(data.microtimestamp) / 1_000) : data.timestamp ? Number(data.timestamp) * 1_000 : null
  return sortBook({ venue: 'Bitstamp', symbol: symbolFor(quote), quote, bids: normalizeLevels(data.bids), asks: normalizeLevels(data.asks), venueTs, fetchedAt })
}

export const bitstampAdapter: VenueAdapter = {
  venue: 'Bitstamp', supportedQuotes: SUPPORTED, defaultMakerBps: 30, defaultTakerBps: 40, corsDirect: true, tier: 1,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Bitstamp', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://www.bitstamp.net/api/v2/order_book/${PAIRS[quote]}/`, signal, false)
    return parseBitstampBook(payload, quote, fetchedAt)
  },
}

export const parseBitstamp = parseBitstampBook

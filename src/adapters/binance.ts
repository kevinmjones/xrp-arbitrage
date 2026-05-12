import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USDT', 'USDC'])
const PAIRS: Record<string, string> = { USDT: 'XRPUSDT', USDC: 'XRPUSDC' }
type BinanceBook = { asks: unknown[][], bids: unknown[][] }

export function parseBinanceBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as BinanceBook
  if (!Array.isArray(data.asks) || !Array.isArray(data.bids)) throw new Error('Binance response missing bids/asks')
  return sortBook({ venue: 'Binance', symbol: symbolFor(quote), quote, bids: normalizeLevels(data.bids), asks: normalizeLevels(data.asks), venueTs: null, fetchedAt })
}

export const binanceAdapter: VenueAdapter = {
  venue: 'Binance', supportedQuotes: SUPPORTED, defaultMakerBps: 10, defaultTakerBps: 10, tier: 2,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Binance', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api.binance.com/api/v3/depth?symbol=${PAIRS[quote]}&limit=500`, signal, false)
    return parseBinanceBook(payload, quote, fetchedAt)
  },
}

export const parseBinance = parseBinanceBook

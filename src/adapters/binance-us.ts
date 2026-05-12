import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USDT'])
const PAIRS: Record<string, string> = { USDT: 'XRPUSDT' }
type BinanceUsBook = { asks: unknown[][], bids: unknown[][] }

export function parseBinanceUsBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as BinanceUsBook
  if (!Array.isArray(data.asks) || !Array.isArray(data.bids)) throw new Error('Binance.US response missing bids/asks')
  return sortBook({ venue: 'Binance.US', symbol: symbolFor(quote), quote, bids: normalizeLevels(data.bids), asks: normalizeLevels(data.asks), venueTs: null, fetchedAt })
}

export const binanceUsAdapter: VenueAdapter = {
  venue: 'Binance.US', supportedQuotes: SUPPORTED, defaultMakerBps: 10, defaultTakerBps: 10, tier: 1,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Binance.US', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api.binance.us/api/v3/depth?symbol=${PAIRS[quote]}&limit=500`, signal, false)
    return parseBinanceUsBook(payload, quote, fetchedAt)
  },
}

export const parseBinanceUs = parseBinanceUsBook

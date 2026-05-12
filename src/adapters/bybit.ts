import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USDT', 'USDC'])
const PAIRS: Record<string, string> = { USDT: 'XRPUSDT', USDC: 'XRPUSDC' }
type BybitBook = { retCode?: number, retMsg?: string, result?: { a: unknown[][], b: unknown[][], ts?: number | string } }

export function parseBybitBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as BybitBook
  if (data.retCode !== undefined && data.retCode !== 0) throw new Error(`Bybit depth error: ${data.retMsg ?? data.retCode}`)
  if (!data.result) throw new Error('Bybit response missing result')
  return sortBook({ venue: 'Bybit', symbol: symbolFor(quote), quote, bids: normalizeLevels(data.result.b), asks: normalizeLevels(data.result.a), venueTs: data.result.ts ? Number(data.result.ts) : null, fetchedAt })
}

export const bybitAdapter: VenueAdapter = {
  venue: 'Bybit', supportedQuotes: SUPPORTED, defaultMakerBps: 10, defaultTakerBps: 10, tier: 2,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Bybit', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${PAIRS[quote]}&limit=200`, signal, false)
    return parseBybitBook(payload, quote, fetchedAt)
  },
}

export const parseBybit = parseBybitBook

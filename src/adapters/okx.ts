import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USDT', 'USDC'])
const PAIRS: Record<string, string> = { USDT: 'XRP-USDT', USDC: 'XRP-USDC' }
type OkxBook = { code?: string, msg?: string, data?: { asks: unknown[][], bids: unknown[][], ts?: string }[] }

export function parseOkxBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as OkxBook
  if (data.code && data.code !== '0') throw new Error(`OKX depth error: ${data.msg ?? data.code}`)
  const book = data.data?.[0]
  if (!book) throw new Error('OKX response missing book data')
  return sortBook({ venue: 'OKX', symbol: symbolFor(quote), quote, bids: normalizeLevels(book.bids), asks: normalizeLevels(book.asks), venueTs: book.ts ? Number(book.ts) : null, fetchedAt })
}

export const okxAdapter: VenueAdapter = {
  venue: 'OKX', supportedQuotes: SUPPORTED, defaultMakerBps: 8, defaultTakerBps: 10, tier: 2,
  async fetchBook(quote, signal) {
    assertSupportedQuote('OKX', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://www.okx.com/api/v5/market/books?instId=${PAIRS[quote]}&sz=400`, signal, false)
    return parseOkxBook(payload, quote, fetchedAt)
  },
}

export const parseOkx = parseOkxBook

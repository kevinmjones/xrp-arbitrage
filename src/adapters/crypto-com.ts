import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USD'])
const PAIRS: Record<string, string> = { USD: 'XRP_USD' }
type CryptoComBook = { code?: number, message?: string, result?: { data?: { asks: unknown[][], bids: unknown[][], t?: number }[] } }

export function parseCryptoComBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as CryptoComBook
  if (data.code !== undefined && data.code !== 0) throw new Error(`Crypto.com depth error: ${data.message ?? data.code}`)
  const book = data.result?.data?.[0]
  if (!book) throw new Error('Crypto.com response missing book data')
  return sortBook({ venue: 'Crypto.com', symbol: symbolFor(quote), quote, bids: normalizeLevels(book.bids), asks: normalizeLevels(book.asks), venueTs: book.t ?? null, fetchedAt })
}

export const cryptoComAdapter: VenueAdapter = {
  venue: 'Crypto.com', supportedQuotes: SUPPORTED, defaultMakerBps: 25, defaultTakerBps: 50, tier: 1,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Crypto.com', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api.crypto.com/exchange/v1/public/get-book?instrument_name=${PAIRS[quote]}&depth=50`, signal, false)
    return parseCryptoComBook(payload, quote, fetchedAt)
  },
}

export const parseCryptoCom = parseCryptoComBook

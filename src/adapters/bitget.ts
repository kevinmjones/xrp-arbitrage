import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USDT'])
const PAIRS: Record<string, string> = { USDT: 'XRPUSDT' }
type BitgetBook = { code?: string, msg?: string, data?: { asks: unknown[][], bids: unknown[][], ts?: string | number } }

export function parseBitgetBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as BitgetBook
  if (data.code && data.code !== '00000') throw new Error(`Bitget depth error: ${data.msg ?? data.code}`)
  if (!data.data) throw new Error('Bitget response missing book data')
  return sortBook({ venue: 'Bitget', symbol: symbolFor(quote), quote, bids: normalizeLevels(data.data.bids), asks: normalizeLevels(data.data.asks), venueTs: data.data.ts ? Number(data.data.ts) : null, fetchedAt })
}

export const bitgetAdapter: VenueAdapter = {
  venue: 'Bitget', supportedQuotes: SUPPORTED, defaultMakerBps: 10, defaultTakerBps: 10, tier: 2,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Bitget', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api.bitget.com/api/v2/spot/market/orderbook?symbol=${PAIRS[quote]}&type=step0&limit=50`, signal, false)
    return parseBitgetBook(payload, quote, fetchedAt)
  },
}

export const parseBitget = parseBitgetBook

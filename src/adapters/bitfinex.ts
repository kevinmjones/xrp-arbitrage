import type { BookLevel, OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USD', 'USDT'])
const PAIRS: Record<string, string> = { USD: 'tXRPUSD', USDT: 'tXRPUST' }
type BitfinexLevel = [number, number, number]

export function parseBitfinexBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const rows = payload as BitfinexLevel[]
  if (!Array.isArray(rows)) throw new Error('Bitfinex response missing book rows')
  const bids: BookLevel[] = []
  const asks: BookLevel[] = []
  for (const [price, _count, amount] of rows) {
    if (!Number.isFinite(price) || !Number.isFinite(amount) || amount === 0) continue
    if (amount > 0) bids.push([price, Math.abs(amount)])
    else asks.push([price, Math.abs(amount)])
  }
  return sortBook({ venue: 'Bitfinex', symbol: symbolFor(quote), quote, bids, asks, venueTs: null, fetchedAt })
}

export const bitfinexAdapter: VenueAdapter = {
  venue: 'Bitfinex', supportedQuotes: SUPPORTED, defaultMakerBps: 0, defaultTakerBps: 0, corsDirect: true, tier: 1,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Bitfinex', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api-pub.bitfinex.com/v2/book/${PAIRS[quote]}/P0?len=100`, signal, false)
    return parseBitfinexBook(payload, quote, fetchedAt)
  },
}

export const parseBitfinex = parseBitfinexBook

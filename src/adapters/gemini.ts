import type { BookLevel, OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USD'])
type GeminiLevel = { price: string, amount: string, timestamp?: string }
type GeminiBook = { asks: GeminiLevel[], bids: GeminiLevel[] }

function parseLevels(levels: GeminiLevel[]): BookLevel[] {
  return levels.map((level) => [Number(level.price), Number(level.amount)] as BookLevel).filter(([price, size]) => Number.isFinite(price) && Number.isFinite(size) && price > 0 && size > 0)
}

export function parseGeminiBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as GeminiBook
  if (!Array.isArray(data.asks) || !Array.isArray(data.bids)) throw new Error('Gemini response missing bids/asks')
  const firstTs = [...data.asks, ...data.bids].map((level) => Number(level.timestamp) * 1_000).filter(Number.isFinite)[0] ?? null
  return sortBook({ venue: 'Gemini', symbol: symbolFor(quote), quote, bids: parseLevels(data.bids), asks: parseLevels(data.asks), venueTs: firstTs, fetchedAt })
}

export const geminiAdapter: VenueAdapter = {
  venue: 'Gemini', supportedQuotes: SUPPORTED, defaultMakerBps: 60, defaultTakerBps: 120, tier: 1,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Gemini', quote, SUPPORTED)
    const fetchedAt = Date.now()
    // Gemini's full-depth REST book is valid but does not send CORS headers from
    // GitHub Pages. Keep it as a tier-1 venue, but fetch through the proxy chain.
    const payload = await fetchJson('https://api.gemini.com/v1/book/xrpusd?limit_bids=50&limit_asks=50', signal, true)
    return parseGeminiBook(payload, quote, fetchedAt)
  },
}

export const parseGemini = parseGeminiBook

import type { OrderBook, Quote, VenueAdapter } from '../types.ts'
import { assertSupportedQuote, fetchJson, normalizeLevels, sortBook, symbolFor } from './base.ts'

const SUPPORTED = new Set<Quote>(['USD', 'USDT', 'USDC', 'EUR'])
const PAIRS: Record<Quote, string> = { USD: 'XRPUSD', USDT: 'XRPUSDT', USDC: 'XRPUSDC', EUR: 'XRPEUR' }

type KrakenLevel = [price: unknown, volume: unknown, timestamp?: unknown]
type KrakenDepth = { error?: string[], result?: Record<string, { asks: KrakenLevel[], bids: KrakenLevel[] }> }

function parseVenueTimestamp(levels: KrakenLevel[]): number | null {
  const timestamps = levels
    .map((level) => Number(level[2]))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0)

  if (timestamps.length === 0) return null
  return Math.max(...timestamps) * 1000
}

export function parseKrakenBook(payload: unknown, quote: Quote, fetchedAt: number): OrderBook {
  const data = payload as KrakenDepth
  if (data.error?.length) throw new Error(`Kraken depth error: ${data.error.join(', ')}`)
  const first = data.result ? Object.values(data.result)[0] : undefined
  if (!first) throw new Error('Kraken response missing depth result')
  return sortBook({
    venue: 'Kraken',
    symbol: symbolFor(quote),
    quote,
    bids: normalizeLevels(first.bids),
    asks: normalizeLevels(first.asks),
    venueTs: parseVenueTimestamp([...first.bids, ...first.asks]),
    fetchedAt,
  })
}

export const krakenAdapter: VenueAdapter = {
  venue: 'Kraken', supportedQuotes: SUPPORTED, defaultMakerBps: 25, defaultTakerBps: 40, corsDirect: true, tier: 1,
  async fetchBook(quote, signal) {
    assertSupportedQuote('Kraken', quote, SUPPORTED)
    const fetchedAt = Date.now()
    const payload = await fetchJson(`https://api.kraken.com/0/public/Depth?pair=${PAIRS[quote]}&count=500`, signal, false)
    return parseKrakenBook(payload, quote, fetchedAt)
  },
}

export const parseKraken = parseKrakenBook

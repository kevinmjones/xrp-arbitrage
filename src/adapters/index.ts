import type { OrderBook, Quote, VenueAdapter } from '../types'
import { krakenAdapter } from './kraken'
import { coinbaseAdapter } from './coinbase'
import { bitstampAdapter } from './bitstamp'
import { geminiAdapter } from './gemini'
import { bitfinexAdapter } from './bitfinex'
import { cryptoComAdapter } from './crypto-com'
import { binanceUsAdapter } from './binance-us'
import { binanceAdapter } from './binance'
import { okxAdapter } from './okx'
import { bybitAdapter } from './bybit'
import { bitgetAdapter } from './bitget'

export const adapters: VenueAdapter[] = [
  krakenAdapter,
  coinbaseAdapter,
  bitstampAdapter,
  geminiAdapter,
  bitfinexAdapter,
  cryptoComAdapter,
  binanceUsAdapter,
  binanceAdapter,
  okxAdapter,
  bybitAdapter,
  bitgetAdapter,
]
export const tier1Adapters: VenueAdapter[] = adapters.filter((adapter) => adapter.tier === 1)
export const tier2Adapters: VenueAdapter[] = adapters.filter((adapter) => adapter.tier === 2)

export function getEnabledAdapters(options: { enableGlobalVenues: boolean }): VenueAdapter[] {
  return options.enableGlobalVenues ? adapters : tier1Adapters
}

export async function fetchVenueBooks(
  venueAdapters: VenueAdapter[],
  quote: Quote,
  signal: AbortSignal,
): Promise<{ books: OrderBook[]; errors: { venue: string; message: string }[] }> {
  const settled = await Promise.allSettled(
    venueAdapters.map(async (adapter) => ({ venue: adapter.venue, book: await adapter.fetchBook(quote, signal) })),
  )
  const books: OrderBook[] = []
  const errors: { venue: string; message: string }[] = []

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      books.push(result.value.book)
    } else {
      const reason = result.reason
      errors.push({
        venue: venueAdapters[index]?.venue ?? 'unknown',
        message: reason instanceof Error ? reason.message : String(reason),
      })
    }
  })

  return { books, errors }
}

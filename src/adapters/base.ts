import type { BookLevel, OrderBook, Quote } from '../types.ts'
import { fetchJsonWithProxyFallback } from '../lib/proxy.ts'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export function normalizeLevels(levels: readonly (readonly unknown[])[]): BookLevel[] {
  return levels
    .map((level) => [Number(level[0]), Number(level[1])] as BookLevel)
    .filter(([price, size]) => Number.isFinite(price) && Number.isFinite(size) && price > 0 && size > 0)
}

export function level(price: unknown, size: unknown): BookLevel {
  return [Number(price), Number(size)]
}

export function book(
  venue: string,
  quote: Quote,
  bids: BookLevel[],
  asks: BookLevel[],
  fetchedAt: number,
  venueTs: number | null = null,
): OrderBook {
  return sortBook({ venue, symbol: symbolFor(quote), quote, bids, asks, venueTs, fetchedAt })
}

export function sortBook(book: OrderBook): OrderBook {
  return {
    ...book,
    bids: [...book.bids].sort((a, b) => b[0] - a[0]),
    asks: [...book.asks].sort((a, b) => a[0] - b[0]),
  }
}

export async function fetchJson<T = unknown>(url: string, signal: AbortSignal, useProxy: boolean, fetcher: FetchLike = fetch): Promise<T> {
  if (useProxy) return await fetchJsonWithProxyFallback(url, signal, fetcher) as T
  const response = await fetcher(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  return await response.json() as T
}

export async function getJson<T = unknown>(url: string, signal: AbortSignal, timeoutMs = 4000, useProxy = false): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const abort = () => controller.abort(signal.reason)
  signal.addEventListener('abort', abort, { once: true })
  try {
    return await fetchJson<T>(url, controller.signal, useProxy)
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', abort)
  }
}

export function symbolFor(quote: Quote): string {
  return `XRP/${quote}`
}

export function assertSupportedQuote(venue: string, quote: Quote, supported: ReadonlySet<Quote>): void {
  if (!supported.has(quote)) throw new Error(`${venue} does not support XRP/${quote}`)
}

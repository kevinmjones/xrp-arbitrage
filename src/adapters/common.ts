import type { OrderBook, PriceLevel, Quote } from '../types'

export function toLevel(level: Array<string | number>, priceIndex = 0, sizeIndex = 1): PriceLevel {
  return [Number(level[priceIndex]), Number(level[sizeIndex])]
}

export function sortBids(levels: PriceLevel[]): PriceLevel[] {
  return levels.filter(validLevel).sort((a, b) => b[0] - a[0])
}

export function sortAsks(levels: PriceLevel[]): PriceLevel[] {
  return levels.filter(validLevel).sort((a, b) => a[0] - b[0])
}

export function validLevel([price, size]: PriceLevel): boolean {
  return Number.isFinite(price) && Number.isFinite(size) && price > 0 && size > 0
}

export function symbolFor(quote: Quote): string {
  return `XRP/${quote}`
}

export function makeBook(
  venue: string,
  quote: Quote,
  bids: PriceLevel[],
  asks: PriceLevel[],
  fetchedAt: number,
  venueTs: number | null = null,
): OrderBook {
  return { venue, symbol: symbolFor(quote), quote, bids: sortBids(bids), asks: sortAsks(asks), venueTs, fetchedAt }
}

export async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

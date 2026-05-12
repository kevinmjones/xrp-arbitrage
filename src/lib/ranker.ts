import type { Config, FeeSchedule, OrderBook, SpreadOpportunity } from '../types'
import { getTakerFeeBps } from './fees'
import { computeVwap } from './vwap'

export interface RankOpportunitiesInput {
  books: OrderBook[]
  notional: number
  feeSchedule?: FeeSchedule
  now?: number
  limit?: number
  refreshIntervalMs?: number
  hideMultiplier?: number
}

export function rankOpportunities(input: RankOpportunitiesInput): SpreadOpportunity[]
export function rankOpportunities(books: OrderBook[], config: Config, now?: number): SpreadOpportunity[]
export function rankOpportunities(
  inputOrBooks: RankOpportunitiesInput | OrderBook[],
  config?: Config,
  nowArg?: number,
): SpreadOpportunity[] {
  const input = Array.isArray(inputOrBooks)
    ? fromConfig(inputOrBooks, config, nowArg)
    : inputOrBooks
  const now = input.now ?? Date.now()
  const maxStaleMs = input.refreshIntervalMs && input.hideMultiplier
    ? input.refreshIntervalMs * input.hideMultiplier
    : null

  const usableBooks = input.books.filter((book) => {
    if (maxStaleMs !== null && now - book.fetchedAt > maxStaleMs) return false
    return computeVwap('buy', input.notional, book.asks).fullyFilled
      && computeVwap('sell', input.notional, book.bids).fullyFilled
  })

  const opportunities: SpreadOpportunity[] = []

  for (const buyBook of usableBooks) {
    const buy = computeVwap('buy', input.notional, buyBook.asks)

    for (const sellBook of usableBooks) {
      if (buyBook.venue === sellBook.venue || buyBook.quote !== sellBook.quote) continue

      const sell = computeVwap('sell', input.notional, sellBook.bids)
      const buyTakerBps = getTakerFeeBps(buyBook.venue, input.feeSchedule)
      const sellTakerBps = getTakerFeeBps(sellBook.venue, input.feeSchedule)
      const buyCostPerXrp = buy.avgPrice * (1 + buyTakerBps / 10_000)
      const sellRecvPerXrp = sell.avgPrice * (1 - sellTakerBps / 10_000)

      opportunities.push({
        buyVenue: buyBook.venue,
        sellVenue: sellBook.venue,
        quote: buyBook.quote,
        notional: input.notional,
        buyVwap: buy.avgPrice,
        sellVwap: sell.avgPrice,
        grossBps: ((sell.avgPrice - buy.avgPrice) / buy.avgPrice) * 10_000,
        netBps: ((sellRecvPerXrp - buyCostPerXrp) / buyCostPerXrp) * 10_000,
        buyTakerBps,
        sellTakerBps,
        maxClearedNotional: Math.min(buy.filledQuote, sell.filledQuote),
        buyVenueStaleMs: now - buyBook.fetchedAt,
        sellVenueStaleMs: now - sellBook.fetchedAt,
      })
    }
  }

  const sorted = opportunities.sort((a, b) => b.netBps - a.netBps)
  return typeof input.limit === 'number' ? sorted.slice(0, input.limit) : sorted
}

function fromConfig(books: OrderBook[], config: Config | undefined, now?: number): RankOpportunitiesInput {
  if (!config) throw new Error('rankOpportunities requires config when called with books')
  return {
    books: books.filter((book) => book.quote === config.quote),
    notional: config.notionalUsd,
    feeSchedule: Object.fromEntries(
      Object.entries(config.feeOverridesBps).map(([venue, takerBps]) => [venue, { makerBps: takerBps, takerBps }]),
    ),
    now,
    limit: config.topN,
    refreshIntervalMs: config.refreshIntervalMs,
    hideMultiplier: config.hideMultiplier,
  }
}

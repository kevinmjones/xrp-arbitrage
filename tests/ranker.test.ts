import { describe, expect, it } from 'vitest'
import type { FeeSchedule, OrderBook } from '../src/types'
import { rankOpportunities } from '../src/lib/ranker'

const fees: FeeSchedule = {
  A: { makerBps: 0, takerBps: 0 },
  B: { makerBps: 0, takerBps: 0 },
  C: { makerBps: 0, takerBps: 0 },
  D: { makerBps: 0, takerBps: 0 },
}

const book = (venue: string, bid: number, ask: number, fetchedAt = 1, quote: 'USD' | 'USDT' = 'USD'): OrderBook => ({
  venue,
  symbol: `XRP/${quote}`,
  quote,
  bids: [[bid, 10_000]],
  asks: [[ask, 10_000]],
  venueTs: null,
  fetchedAt,
})

describe('rankOpportunities', () => {
  it('net equals gross when fees are zero', () => {
    const [row] = rankOpportunities({ books: [book('A', 2.49, 2.50), book('B', 2.60, 2.61)], notional: 1_000, feeSchedule: fees })
    expect(row.buyVenue).toBe('A')
    expect(row.sellVenue).toBe('B')
    expect(row.netBps).toBeCloseTo(row.grossBps, 8)
  })

  it('subtracts taker fees and sorts by net bps', () => {
    const rows = rankOpportunities({
      books: [book('A', 2.49, 2.50), book('B', 2.60, 2.61)],
      notional: 1_000,
      feeSchedule: { A: { makerBps: 0, takerBps: 40 }, B: { makerBps: 0, takerBps: 40 } },
    })
    expect(rows[0].netBps).toBeLessThan(rows[0].grossBps)
  })

  it('builds a cartesian set of directed cross-venue pairs for matching quotes', () => {
    const rows = rankOpportunities({
      books: [book('A', 2.49, 2.50), book('B', 2.59, 2.60), book('C', 2.69, 2.70), book('D', 2.79, 2.80, 1, 'USDT')],
      notional: 1_000,
      feeSchedule: fees,
      now: 1,
    })

    expect(rows).toHaveLength(6)
    expect(rows.map((row) => `${row.buyVenue}->${row.sellVenue}`).sort()).toEqual([
      'A->B', 'A->C', 'B->A', 'B->C', 'C->A', 'C->B',
    ])
  })

  it('omits venues without enough depth for the requested notional', () => {
    const rows = rankOpportunities({
      books: [book('A', 2.49, 2.50), { ...book('B', 2.60, 2.61), bids: [[2.60, 1]], asks: [[2.61, 1]] }],
      notional: 1_000,
      feeSchedule: fees,
    })
    expect(rows).toHaveLength(0)
  })

  it('hides stale rows beyond hide multiplier', () => {
    const rows = rankOpportunities({
      books: [book('A', 2.49, 2.50, 0), book('B', 2.60, 2.61, 0)],
      notional: 1_000,
      feeSchedule: fees,
      refreshIntervalMs: 5_000,
      hideMultiplier: 4,
      now: 25_001,
    })
    expect(rows).toHaveLength(0)
  })

  it('limits output after sorting by net bps', () => {
    const rows = rankOpportunities({
      books: [book('A', 2.49, 2.50), book('B', 2.59, 2.60), book('C', 2.69, 2.70)],
      notional: 1_000,
      feeSchedule: fees,
      limit: 2,
    })
    expect(rows).toHaveLength(2)
    expect(rows[0].netBps).toBeGreaterThanOrEqual(rows[1].netBps)
  })
})

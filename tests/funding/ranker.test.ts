import { describe, expect, it } from 'vitest'
import type { FundingRate } from '../../src/funding/types.ts'
import { rankFundingOpportunities, toFundingOpportunity } from '../../src/funding/ranker.ts'

const baseRate = (overrides: Partial<FundingRate> = {}): FundingRate => ({
  venue: 'Binance',
  symbol: 'XRPUSDT',
  baseAsset: 'XRP',
  quoteAsset: 'USDT',
  fundingRate: 0.0001,
  fundingIntervalHours: 8,
  nextFundingTime: 1716816000000,
  markPrice: 2.501,
  indexPrice: 2.495,
  basisBps: ((2.501 - 2.495) / 2.495) * 10_000,
  fetchedAt: 1716800000000,
  ...overrides,
})

describe('toFundingOpportunity', () => {
  it('converts decimal rate to bps and annualized percent for an 8h interval', () => {
    const op = toFundingOpportunity(baseRate({ fundingRate: 0.0001, fundingIntervalHours: 8 }))
    expect(op.fundingRateBps).toBeCloseTo(1, 8)
    expect(op.absFundingBps).toBeCloseTo(1, 8)
    expect(op.annualizedPct).toBeCloseTo(0.0001 * 3 * 365 * 100, 6)
  })

  it('handles negative funding (shorts pay longs)', () => {
    const op = toFundingOpportunity(baseRate({ fundingRate: -0.0002 }))
    expect(op.fundingRateBps).toBeCloseTo(-2, 8)
    expect(op.absFundingBps).toBeCloseTo(2, 8)
    expect(op.annualizedPct).toBeLessThan(0)
  })

  it('annualizes correctly for non-8h intervals', () => {
    const op = toFundingOpportunity(baseRate({ fundingRate: 0.0001, fundingIntervalHours: 4 }))
    expect(op.annualizedPct).toBeCloseTo(0.0001 * 6 * 365 * 100, 6)
  })

  it('preserves venue, symbol, next funding time, mark/index, basis', () => {
    const rate = baseRate({ venue: 'OKX', symbol: 'XRP-USDT-SWAP', nextFundingTime: 1716828800000 })
    const op = toFundingOpportunity(rate)
    expect(op.venue).toBe('OKX')
    expect(op.symbol).toBe('XRP-USDT-SWAP')
    expect(op.nextFundingTime).toBe(1716828800000)
    expect(op.markPrice).toBe(rate.markPrice)
    expect(op.indexPrice).toBe(rate.indexPrice)
    expect(op.basisBps).toBe(rate.basisBps)
  })
})

describe('rankFundingOpportunities', () => {
  it('sorts by absolute funding bps descending by default', () => {
    const rows = rankFundingOpportunities([
      baseRate({ venue: 'A', fundingRate: 0.0001 }),
      baseRate({ venue: 'B', fundingRate: -0.0003 }),
      baseRate({ venue: 'C', fundingRate: 0.00005 }),
    ])
    expect(rows.map((r) => r.venue)).toEqual(['B', 'A', 'C'])
  })

  it('supports sorting by annualizedPct descending', () => {
    const rows = rankFundingOpportunities(
      [
        baseRate({ venue: 'A', fundingRate: 0.0001, fundingIntervalHours: 8 }),
        baseRate({ venue: 'B', fundingRate: 0.0001, fundingIntervalHours: 4 }),
      ],
      { sortBy: 'annualizedPct' },
    )
    expect(rows[0].venue).toBe('B')
  })

  it('limits the number of results after sorting', () => {
    const rows = rankFundingOpportunities(
      [
        baseRate({ venue: 'A', fundingRate: 0.0001 }),
        baseRate({ venue: 'B', fundingRate: 0.0003 }),
        baseRate({ venue: 'C', fundingRate: 0.0002 }),
      ],
      { limit: 2 },
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].venue).toBe('B')
    expect(rows[1].venue).toBe('C')
  })

  it('returns an empty list when given no rates', () => {
    expect(rankFundingOpportunities([])).toEqual([])
  })
})

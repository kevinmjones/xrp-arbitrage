import { describe, expect, it } from 'vitest'
import type { FundingOpportunity } from '../../src/funding/types'
import { toFundingRow } from '../../src/funding/live'

const opportunity: FundingOpportunity = {
  venue: 'Binance',
  symbol: 'XRPUSDT',
  baseAsset: 'XRP',
  quoteAsset: 'USDT',
  fundingRateBps: 2,
  absFundingBps: 2,
  fundingIntervalHours: 4,
  annualizedPct: 43.8,
  nextFundingTime: 1_000_600,
  markPrice: 2.4,
  indexPrice: 2.39,
  basisBps: 41.84,
  fetchedAt: 999_000,
}

describe('funding live row mapping', () => {
  it('normalizes venue funding opportunities into UI rows', () => {
    expect(toFundingRow(opportunity, 1_000_000)).toEqual({
      symbol: 'XRPUSDT',
      venue: 'Binance',
      fundingBpsPer8h: 4,
      annualizedPct: 43.8,
      nextFundingMs: 600,
      markIndexBasisBps: 41.84,
      ageMs: 1_000,
      status: 'ok',
    })
  })
})

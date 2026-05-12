import type { FundingOpportunity, FundingRate } from './types.ts'

export type FundingSortKey = 'absFundingBps' | 'annualizedPct'

export interface RankFundingOptions {
  sortBy?: FundingSortKey
  limit?: number
}

const INTERVALS_PER_DAY_24H = 24

export function toFundingOpportunity(rate: FundingRate): FundingOpportunity {
  const fundingRateBps = rate.fundingRate * 10_000
  const intervalsPerDay = INTERVALS_PER_DAY_24H / rate.fundingIntervalHours
  const annualizedPct = rate.fundingRate * intervalsPerDay * 365 * 100
  return {
    venue: rate.venue,
    symbol: rate.symbol,
    baseAsset: rate.baseAsset,
    quoteAsset: rate.quoteAsset,
    fundingRateBps,
    absFundingBps: Math.abs(fundingRateBps),
    fundingIntervalHours: rate.fundingIntervalHours,
    annualizedPct,
    nextFundingTime: rate.nextFundingTime,
    markPrice: rate.markPrice,
    indexPrice: rate.indexPrice,
    basisBps: rate.basisBps,
    fetchedAt: rate.fetchedAt,
  }
}

export function rankFundingOpportunities(
  rates: readonly FundingRate[],
  options: RankFundingOptions = {},
): FundingOpportunity[] {
  const sortBy: FundingSortKey = options.sortBy ?? 'absFundingBps'
  const opportunities = rates.map(toFundingOpportunity)
  const sorted = [...opportunities].sort((a, b) => Math.abs(b[sortBy]) - Math.abs(a[sortBy]))
  return typeof options.limit === 'number' ? sorted.slice(0, options.limit) : sorted
}

export interface FundingRate {
  venue: string
  symbol: string
  baseAsset: string
  quoteAsset: string
  fundingRate: number
  fundingIntervalHours: number
  nextFundingTime: number
  markPrice: number | null
  indexPrice: number | null
  basisBps: number | null
  fetchedAt: number
}

export interface FundingOpportunity {
  venue: string
  symbol: string
  baseAsset: string
  quoteAsset: string
  fundingRateBps: number
  absFundingBps: number
  fundingIntervalHours: number
  annualizedPct: number
  nextFundingTime: number
  markPrice: number | null
  indexPrice: number | null
  basisBps: number | null
  fetchedAt: number
}

export function computeBasisBps(markPrice: number | null, indexPrice: number | null): number | null {
  if (markPrice === null || indexPrice === null) return null
  if (!Number.isFinite(markPrice) || !Number.isFinite(indexPrice) || indexPrice <= 0) return null
  return ((markPrice - indexPrice) / indexPrice) * 10_000
}

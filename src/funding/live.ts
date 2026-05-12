import { getJson } from '../adapters/base.ts'
import type { FundingRow } from '../types.ts'
import { parseBinancePremiumIndex } from './adapters/binance-funding.ts'
import { parseBybitFundingTicker } from './adapters/bybit-funding.ts'
import { mergeOkxFundingAndMark, parseOkxFundingRate, parseOkxMarkPrice } from './adapters/okx-funding.ts'
import { rankFundingOpportunities } from './ranker.ts'
import type { FundingOpportunity, FundingRate } from './types.ts'

const BINANCE_PREMIUM_INDEX_URL = 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=XRPUSDT'
const OKX_FUNDING_URL = 'https://www.okx.com/api/v5/public/funding-rate?instId=XRP-USDT-SWAP'
const OKX_MARK_URL = 'https://www.okx.com/api/v5/public/mark-price?instType=SWAP&instId=XRP-USDT-SWAP'
const BYBIT_TICKER_URL = 'https://api.bybit.com/v5/market/tickers?category=linear&symbol=XRPUSDT'

export interface FetchFundingOptions {
  timeoutMs: number
  limit?: number
}

export async function fetchFundingRows(signal: AbortSignal, options: FetchFundingOptions): Promise<FundingRow[]> {
  const rates = await fetchFundingRates(signal, options.timeoutMs)
  return rankFundingOpportunities(rates, { limit: options.limit }).map((row) => toFundingRow(row, Date.now()))
}

export async function fetchFundingRates(signal: AbortSignal, timeoutMs: number): Promise<FundingRate[]> {
  const settled = await Promise.allSettled([
    fetchBinanceFunding(signal, timeoutMs),
    fetchOkxFunding(signal, timeoutMs),
    fetchBybitFunding(signal, timeoutMs),
  ])
  return settled
    .filter((result): result is PromiseFulfilledResult<FundingRate> => result.status === 'fulfilled')
    .map((result) => result.value)
}

export async function fetchBinanceFunding(signal: AbortSignal, timeoutMs: number): Promise<FundingRate> {
  const fetchedAt = Date.now()
  const payload = await getJson(BINANCE_PREMIUM_INDEX_URL, signal, timeoutMs, true)
  return parseBinancePremiumIndex(payload, fetchedAt)
}

export async function fetchOkxFunding(signal: AbortSignal, timeoutMs: number): Promise<FundingRate> {
  const fetchedAt = Date.now()
  const [fundingPayload, markPayload] = await Promise.all([
    getJson(OKX_FUNDING_URL, signal, timeoutMs, true),
    getJson(OKX_MARK_URL, signal, timeoutMs, true),
  ])
  return mergeOkxFundingAndMark(parseOkxFundingRate(fundingPayload, fetchedAt), parseOkxMarkPrice(markPayload))
}

export async function fetchBybitFunding(signal: AbortSignal, timeoutMs: number): Promise<FundingRate> {
  const fetchedAt = Date.now()
  const payload = await getJson(BYBIT_TICKER_URL, signal, timeoutMs, true)
  return parseBybitFundingTicker(payload, fetchedAt)
}

export function toFundingRow(opportunity: FundingOpportunity, now: number): FundingRow {
  const ageMs = Math.max(0, now - opportunity.fetchedAt)
  return {
    symbol: opportunity.symbol,
    venue: opportunity.venue,
    fundingBpsPer8h: opportunity.fundingRateBps * (8 / opportunity.fundingIntervalHours),
    annualizedPct: opportunity.annualizedPct,
    nextFundingMs: Math.max(0, opportunity.nextFundingTime - now),
    markIndexBasisBps: opportunity.basisBps,
    ageMs,
    status: 'ok',
  }
}

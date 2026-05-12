import type { FundingRate } from '../types.ts'
import { computeBasisBps } from '../types.ts'

interface OkxFundingEntry {
  instId?: string
  fundingRate?: string | number
  nextFundingTime?: string | number
  fundingTime?: string | number
}

interface OkxFundingResponse {
  code?: string
  msg?: string
  data?: OkxFundingEntry[]
}

interface OkxMarkEntry {
  instId?: string
  markPx?: string | number
}

interface OkxMarkResponse {
  code?: string
  msg?: string
  data?: OkxMarkEntry[]
}

export interface OkxMarkPrice {
  instId: string
  markPrice: number
}

function num(value: unknown, field: string): number {
  if (value === undefined || value === null || value === '') {
    throw new Error(`OKX missing/invalid field: ${field}`)
  }
  const n = Number(value)
  if (!Number.isFinite(n)) throw new Error(`OKX non-numeric field: ${field}`)
  return n
}

function quoteFromInstId(instId: string): string {
  const parts = instId.split('-')
  return parts[1] ?? 'USDT'
}

function baseFromInstId(instId: string): string {
  const parts = instId.split('-')
  return parts[0] ?? 'XRP'
}

export function parseOkxFundingRate(payload: unknown, fetchedAt: number): FundingRate {
  const data = payload as OkxFundingResponse
  if (!data || typeof data !== 'object') throw new Error('OKX funding-rate: invalid payload')
  if (data.code !== undefined && data.code !== '0') {
    throw new Error(`OKX funding-rate error: ${data.msg ?? data.code}`)
  }
  const entry = data.data?.[0]
  if (!entry || !entry.instId) throw new Error('OKX funding-rate: missing data')

  return {
    venue: 'OKX',
    symbol: entry.instId,
    baseAsset: baseFromInstId(entry.instId),
    quoteAsset: quoteFromInstId(entry.instId),
    fundingRate: num(entry.fundingRate, 'fundingRate'),
    fundingIntervalHours: 8,
    nextFundingTime: num(entry.nextFundingTime, 'nextFundingTime'),
    markPrice: null,
    indexPrice: null,
    basisBps: null,
    fetchedAt,
  }
}

export function parseOkxMarkPrice(payload: unknown): OkxMarkPrice {
  const data = payload as OkxMarkResponse
  if (!data || typeof data !== 'object') throw new Error('OKX mark-price: invalid payload')
  if (data.code !== undefined && data.code !== '0') {
    throw new Error(`OKX mark-price error: ${data.msg ?? data.code}`)
  }
  const entry = data.data?.[0]
  if (!entry || !entry.instId) throw new Error('OKX mark-price: missing data')
  return { instId: entry.instId, markPrice: num(entry.markPx, 'markPx') }
}

export function mergeOkxFundingAndMark(rate: FundingRate, mark: OkxMarkPrice): FundingRate {
  if (rate.symbol !== mark.instId) {
    throw new Error(`OKX merge symbol mismatch: ${rate.symbol} vs ${mark.instId}`)
  }
  return {
    ...rate,
    markPrice: mark.markPrice,
    basisBps: computeBasisBps(mark.markPrice, rate.indexPrice),
  }
}

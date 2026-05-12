import type { FundingRate } from '../types.ts'
import { computeBasisBps } from '../types.ts'

interface BinancePremiumIndex {
  symbol?: string
  markPrice?: string | number
  indexPrice?: string | number
  lastFundingRate?: string | number
  nextFundingTime?: number | string
}

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function requireNumber(value: unknown, field: string): number {
  const n = toNumberOrNull(value)
  if (n === null) throw new Error(`Binance premiumIndex missing/invalid field: ${field}`)
  return n
}

export function parseBinancePremiumIndex(payload: unknown, fetchedAt: number): FundingRate {
  const data = payload as BinancePremiumIndex
  if (!data || typeof data !== 'object') throw new Error('Binance premiumIndex: invalid payload')
  if (!data.symbol) throw new Error('Binance premiumIndex missing symbol')

  const symbol = data.symbol
  const baseAsset = 'XRP'
  const quoteAsset = symbol.endsWith('USDT') ? 'USDT' : symbol.endsWith('USDC') ? 'USDC' : symbol.replace('XRP', '')

  const fundingRate = requireNumber(data.lastFundingRate, 'lastFundingRate')
  const nextFundingTime = requireNumber(data.nextFundingTime, 'nextFundingTime')
  const markPrice = toNumberOrNull(data.markPrice)
  const indexPrice = toNumberOrNull(data.indexPrice)

  return {
    venue: 'Binance',
    symbol,
    baseAsset,
    quoteAsset,
    fundingRate,
    fundingIntervalHours: 8,
    nextFundingTime,
    markPrice,
    indexPrice,
    basisBps: computeBasisBps(markPrice, indexPrice),
    fetchedAt,
  }
}

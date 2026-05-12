import type { FundingRate } from '../types.ts'
import { computeBasisBps } from '../types.ts'

interface BybitTicker {
  symbol?: string
  markPrice?: string | number
  indexPrice?: string | number
  fundingRate?: string | number
  nextFundingTime?: string | number
}

interface BybitTickersResponse {
  retCode?: number
  retMsg?: string
  result?: { list?: BybitTicker[] }
}

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function requireNumber(value: unknown, field: string): number {
  const n = toNumberOrNull(value)
  if (n === null) throw new Error(`Bybit funding ticker missing/invalid field: ${field}`)
  return n
}

function quoteFromSymbol(symbol: string): string {
  if (symbol.endsWith('USDT')) return 'USDT'
  if (symbol.endsWith('USDC')) return 'USDC'
  if (symbol.endsWith('USD')) return 'USD'
  return symbol.replace(/^XRP/, '')
}

export function parseBybitFundingTicker(payload: unknown, fetchedAt: number): FundingRate {
  const data = payload as BybitTickersResponse
  if (!data || typeof data !== 'object') throw new Error('Bybit tickers: invalid payload')
  if (data.retCode !== undefined && data.retCode !== 0) {
    throw new Error(`Bybit tickers error: ${data.retMsg ?? data.retCode}`)
  }
  const entry = data.result?.list?.[0]
  if (!entry || !entry.symbol) throw new Error('Bybit tickers: missing list entry')

  const symbol = entry.symbol
  const markPrice = toNumberOrNull(entry.markPrice)
  const indexPrice = toNumberOrNull(entry.indexPrice)

  return {
    venue: 'Bybit',
    symbol,
    baseAsset: 'XRP',
    quoteAsset: quoteFromSymbol(symbol),
    fundingRate: requireNumber(entry.fundingRate, 'fundingRate'),
    fundingIntervalHours: 8,
    nextFundingTime: requireNumber(entry.nextFundingTime, 'nextFundingTime'),
    markPrice,
    indexPrice,
    basisBps: computeBasisBps(markPrice, indexPrice),
    fetchedAt,
  }
}

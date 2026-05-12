import type { FeeEntry, FeeSchedule } from '../types'

export const DEFAULT_FEE_SCHEDULE: FeeSchedule = {
  Kraken: { makerBps: 25, takerBps: 40 },
  'Coinbase Exchange': { makerBps: 60, takerBps: 120 },
  Coinbase: { makerBps: 60, takerBps: 120 },
  Bitstamp: { makerBps: 30, takerBps: 40 },
  Gemini: { makerBps: 60, takerBps: 120 },
  Bitfinex: { makerBps: 0, takerBps: 0 },
  Binance: { makerBps: 10, takerBps: 10 },
  OKX: { makerBps: 8, takerBps: 10 },
  Bybit: { makerBps: 10, takerBps: 10 },
}

export type FeeOverrides = Record<string, Partial<FeeEntry>>

export function mergeFeeOverrides(base: FeeSchedule, overrides: FeeOverrides): FeeSchedule {
  const merged: FeeSchedule = Object.fromEntries(
    Object.entries(base).map(([venue, fee]) => [venue, { ...fee }]),
  )

  for (const [venue, override] of Object.entries(overrides)) {
    const current = merged[venue] ?? { makerBps: 0, takerBps: 0 }
    merged[venue] = {
      makerBps: override.makerBps ?? current.makerBps,
      takerBps: override.takerBps ?? current.takerBps,
    }
  }

  return merged
}

export function getTakerFeeBps(venue: string, schedule: FeeSchedule = DEFAULT_FEE_SCHEDULE): number {
  const fee = schedule[venue]
  if (!fee) {
    throw new Error(`No fee schedule configured for venue: ${venue}`)
  }
  return fee.takerBps
}

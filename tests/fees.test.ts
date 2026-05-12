import { describe, expect, it } from 'vitest'
import { DEFAULT_FEE_SCHEDULE, getTakerFeeBps, mergeFeeOverrides } from '../src/lib/fees'

describe('fees', () => {
  it('uses PRD default taker fees for tier-1 venues', () => {
    expect(getTakerFeeBps('Kraken')).toBe(40)
    expect(getTakerFeeBps('Coinbase Exchange')).toBe(120)
    expect(getTakerFeeBps('Bitstamp')).toBe(40)
    expect(getTakerFeeBps('Gemini')).toBe(120)
    expect(getTakerFeeBps('Bitfinex')).toBe(0)
  })

  it('applies per-venue overrides without mutating defaults', () => {
    const fees = mergeFeeOverrides(DEFAULT_FEE_SCHEDULE, {
      Kraken: { makerBps: 12, takerBps: 34 },
      CustomVenue: { makerBps: 1, takerBps: 2 },
    })

    expect(fees.Kraken).toEqual({ makerBps: 12, takerBps: 34 })
    expect(fees.CustomVenue).toEqual({ makerBps: 1, takerBps: 2 })
    expect(DEFAULT_FEE_SCHEDULE.Kraken).toEqual({ makerBps: 25, takerBps: 40 })
  })

  it('returns an override taker fee from a supplied schedule', () => {
    const fees = mergeFeeOverrides(DEFAULT_FEE_SCHEDULE, {
      Kraken: { takerBps: 15 },
    })

    expect(getTakerFeeBps('Kraken', fees)).toBe(15)
  })

  it('throws for unknown venues without a fee entry', () => {
    expect(() => getTakerFeeBps('Unknown')).toThrow(/fee/i)
  })
})

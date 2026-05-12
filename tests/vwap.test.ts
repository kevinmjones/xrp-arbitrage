import { describe, expect, it } from 'vitest'
import { calculateVwap } from '../src/lib/vwap'

describe('calculateVwap', () => {
  it('matches the PRD reference fixture', () => {
    const result = calculateVwap('buy', 10_000, [[2.50, 1000], [2.51, 5000], [2.52, 10000]])
    expect(result.fullyFilled).toBe(true)
    expect(result.filledBase).toBeCloseTo(3988.0478, 4)
    expect(result.avgPrice).toBeCloseTo(2.50749, 5)
    const slippageBps = ((result.avgPrice - 2.495) / 2.495) * 10_000
    expect(slippageBps).toBeCloseTo(50.1, 1)
  })

  it('handles single-level full fill', () => {
    expect(calculateVwap('buy', 250, [[2.5, 100]]).avgPrice).toBe(2.5)
  })

  it('partially fills the last level by quote notional', () => {
    const result = calculateVwap('buy', 375, [[2.5, 100], [2.0, 100]])
    expect(result.fullyFilled).toBe(true)
    expect(result.filledQuote).toBe(375)
    expect(result.filledBase).toBeCloseTo(162.5, 8)
    expect(result.levelsConsumed).toBe(2)
  })

  it('flags insufficient liquidity', () => {
    const result = calculateVwap('buy', 1_000, [[2.5, 100]])
    expect(result.fullyFilled).toBe(false)
    expect(result.filledQuote).toBe(250)
  })

  it('handles empty books', () => {
    expect(calculateVwap('sell', 1_000, []).fullyFilled).toBe(false)
  })

  it('is symmetric for sell side over bids by quote notional', () => {
    const result = calculateVwap('sell', 500, [[2.5, 100], [2.49, 200]])
    expect(result.fullyFilled).toBe(true)
    expect(result.filledQuote).toBe(500)
    expect(result.filledBase).toBeCloseTo(200.4016064257, 8)
    expect(result.avgPrice).toBeCloseTo(2.49498998, 8)
  })

  it('rejects non-positive notionals', () => {
    expect(() => calculateVwap('buy', 0, [[2.5, 1]])).toThrow(/notional/i)
  })
})

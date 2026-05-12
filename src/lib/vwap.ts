import type { PriceLevel, Side, VwapResult } from '../types'

export function computeVwap(side: Side, notional: number, levels: PriceLevel[]): VwapResult {
  if (!Number.isFinite(notional) || notional <= 0) {
    throw new Error('notional must be a positive finite number')
  }

  let quoteRemaining = notional
  let filledBase = 0
  let filledQuote = 0
  let levelsConsumed = 0

  for (const [price, size] of levels) {
    if (quoteRemaining <= 0) break
    if (!Number.isFinite(price) || !Number.isFinite(size) || price <= 0 || size <= 0) {
      continue
    }

    const levelCap = price * size
    levelsConsumed += 1

    if (quoteRemaining >= levelCap) {
      filledQuote += levelCap
      filledBase += size
      quoteRemaining -= levelCap
    } else {
      filledQuote += quoteRemaining
      filledBase += quoteRemaining / price
      quoteRemaining = 0
      break
    }
  }

  return {
    side,
    notional,
    filledBase,
    filledQuote,
    avgPrice: filledBase > 0 ? filledQuote / filledBase : 0,
    levelsConsumed,
    fullyFilled: quoteRemaining <= 1e-9,
  }
}

export const calculateVwap = computeVwap

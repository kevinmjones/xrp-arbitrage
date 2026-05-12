import type { Config, Quote } from './types'

export const QUOTES: Quote[] = ['USD', 'USDT', 'USDC', 'EUR']
export const NOTIONAL_PRESETS = [1_000, 10_000, 50_000]
export const REFRESH_PRESETS = [2_000, 5_000, 10_000, 30_000]

export const DEFAULTS = {
  notionalUsd: 10_000,
  quote: 'USD' as Quote,
  refreshIntervalMs: 5_000,
  staleMultiplier: 2,
  hideMultiplier: 4,
  topN: 10,
  enableGlobalVenues: false,
  fetchTimeoutMs: 4_000,
  proxyTimeoutMs: 8_000,
}

const STORAGE_KEY = 'xrp-arb-config-v1'

export function defaultConfig(venues: string[]): Config {
  return {
    ...DEFAULTS,
    selectedVenues: Object.fromEntries(venues.map((venue) => [venue, true])),
    feeOverridesBps: {},
  }
}

export function loadConfig(venues: string[]): Config {
  const fallback = defaultConfig(venues)
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return fallback
    const parsed = JSON.parse(stored) as Partial<Config>
    return {
      ...fallback,
      ...parsed,
      selectedVenues: { ...fallback.selectedVenues, ...(parsed.selectedVenues ?? {}) },
      feeOverridesBps: { ...(parsed.feeOverridesBps ?? {}) },
    }
  } catch {
    return fallback
  }
}

export function saveConfig(config: Config): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

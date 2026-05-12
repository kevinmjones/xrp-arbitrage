import type { Config, VenueAdapter } from '../types'

export function isAdapterActive(adapter: VenueAdapter, config: Config): boolean {
  if (!config.selectedVenues[adapter.venue]) return false
  if (!adapter.supportedQuotes.has(config.quote)) return false
  if (adapter.tier === 2 && !config.enableGlobalVenues) return false
  return true
}

export function activeAdapters(adapters: VenueAdapter[], config: Config): VenueAdapter[] {
  return adapters.filter((adapter) => isAdapterActive(adapter, config))
}

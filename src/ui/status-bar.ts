import type { Config, VenueAdapter, VenueState } from '../types';
import { age } from './format';

export function renderStatus(root: HTMLElement, states: Map<string, VenueState>, config: Config, adapters: VenueAdapter[] = [], now = Date.now()): void {
  const staleAfter = config.refreshIntervalMs * config.staleMultiplier;
  const activeVenues = adapters.filter((adapter) => {
    if (!config.selectedVenues[adapter.venue]) return false;
    if (!adapter.supportedQuotes.has(config.quote)) return false;
    if (!adapter.corsDirect && !config.enableGlobalVenues) return false;
    if (['Binance', 'OKX', 'Bybit'].includes(adapter.venue) && !config.enableGlobalVenues) return false;
    return true;
  });
  const visibleStates = adapters.length > 0
    ? activeVenues.map((adapter) => [adapter.venue, states.get(adapter.venue) ?? { book: null, status: 'idle' as const, error: null, updatedAt: null }] as const)
    : [...states.entries()];
  const staleCount = visibleStates.filter(([, state]) => state.book && now - state.book.fetchedAt > staleAfter).length;
  const errorCount = visibleStates.filter(([, state]) => state.status === 'error').length;
  const okCount = visibleStates.filter(([, state]) => state.status === 'ok' && state.book && now - state.book.fetchedAt <= staleAfter).length;

  root.innerHTML = `
    <div class="status-summary">
      <span>STATUS</span>
      <strong>${okCount}/${visibleStates.length} fresh</strong>
      <span>${staleCount} stale</span>
      <span>${errorCount} error</span>
      <span>${config.quote} · ${config.refreshIntervalMs / 1000}s · ${config.enableGlobalVenues ? 'global on' : 'global off'}</span>
    </div>
    <div class="status-venues">${visibleStates.map(([venue, state]) => {
    const bookAge = state.book ? now - state.book.fetchedAt : Infinity;
    const freshness = state.status === 'ok' && state.book && bookAge <= staleAfter ? 'fresh' : state.book && bookAge > staleAfter ? 'stale' : state.status;
    const marker = state.status === 'error' ? 'ERR' : state.status === 'loading' ? 'POLL' : state.book ? (bookAge > staleAfter ? 'STALE' : 'OK') : 'IDLE';
    const label = state.book ? age(bookAge) : state.error ? state.error : 'idle';
    return `<span class="venue-pill ${freshness}"><b>${venue}</b> ${marker} <em>${label}</em></span>`;
  }).join('')}</div>`;
}

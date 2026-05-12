import type { Config, VenueAdapter } from '../types';
import { NOTIONAL_PRESETS, QUOTES, REFRESH_PRESETS } from '../config';
import { usd } from './format';

type Change = (config: Config, restart?: boolean) => void;

export function renderControls(root: HTMLElement, config: Config, adapters: VenueAdapter[], onChange: Change): void {
  const tier1 = adapters.filter((adapter) => adapter.corsDirect && !['Binance', 'OKX', 'Bybit'].includes(adapter.venue)).length;
  const activeCount = adapters.filter((adapter) => config.selectedVenues[adapter.venue]).length;
  root.innerHTML = `
    <div class="section-label">Controls</div>
    <div class="control-grid">
      <label class="field">Notional <select data-key="notionalUsd">${NOTIONAL_PRESETS.map((n) => `<option value="${n}" ${n === config.notionalUsd ? 'selected' : ''}>${usd(n)}</option>`).join('')}</select></label>
      <label class="field">Quote <select data-key="quote">${QUOTES.map((q) => `<option value="${q}" ${q === config.quote ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
      <label class="field">Refresh <select data-key="refreshIntervalMs">${REFRESH_PRESETS.map((ms) => `<option value="${ms}" ${ms === config.refreshIntervalMs ? 'selected' : ''}>${ms / 1000}s</option>`).join('')}</select></label>
      <label class="switch"><input type="checkbox" data-key="enableGlobalVenues" ${config.enableGlobalVenues ? 'checked' : ''}/><span>Global venues</span><small>${config.enableGlobalVenues ? 'TIER 1+2' : `TIER 1 ONLY (${tier1})`}</small></label>
    </div>
    <div class="section-label venue-heading">Venues <span>${activeCount}/${adapters.length} armed</span></div>
    <div class="venue-grid">${adapters.map((adapter) => {
      const enabledByGlobal = adapter.corsDirect || config.enableGlobalVenues;
      const enabledByQuote = adapter.supportedQuotes.has(config.quote);
      const unavailable = !enabledByGlobal || !enabledByQuote;
      const reason = !enabledByQuote ? `${config.quote} unsupported` : !enabledByGlobal ? 'global disabled' : `taker ${adapter.defaultTakerBps} bps`;
      return `
      <div class="venue-card ${config.selectedVenues[adapter.venue] ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}">
        <label class="check"><input type="checkbox" data-venue="${adapter.venue}" ${config.selectedVenues[adapter.venue] ? 'checked' : ''}/> <span>${adapter.venue}</span></label>
        <div class="venue-meta">${reason}</div>
        <label class="fee">Fee bps <input type="number" min="0" step="1" data-fee="${adapter.venue}" value="${config.feeOverridesBps[adapter.venue] ?? adapter.defaultTakerBps}"/></label>
      </div>`;
    }).join('')}</div>`;

  root.onchange = (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const next: Config = { ...config, selectedVenues: { ...config.selectedVenues }, feeOverridesBps: { ...config.feeOverridesBps } };
    let restart = false;
    const key = target.dataset.key as keyof Config | undefined;
    if (key === 'notionalUsd' || key === 'refreshIntervalMs') next[key] = Number(target.value) as never;
    if (key === 'quote') { next.quote = target.value as Config['quote']; restart = true; }
    if (key === 'enableGlobalVenues') { next.enableGlobalVenues = (target as HTMLInputElement).checked; restart = true; }
    if (target.dataset.venue) { next.selectedVenues[target.dataset.venue] = (target as HTMLInputElement).checked; restart = true; }
    if (target.dataset.fee) next.feeOverridesBps[target.dataset.fee] = Number(target.value);
    if (key === 'refreshIntervalMs') restart = true;
    onChange(next, restart);
  };
}

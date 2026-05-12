import type { Config, SpreadOpportunity } from '../types';
import { age, bps, price, usd } from './format';

export function renderTable(root: HTMLElement, rows: SpreadOpportunity[], config: Config): void {
  const staleAfter = config.refreshIntervalMs * config.staleMultiplier;
  if (rows.length === 0) {
    root.innerHTML = `<div class="empty-state"><strong>No visible spread stack</strong><span>Waiting for matching, fresh books with enough depth. Books older than ${config.hideMultiplier}× refresh are hidden.</span></div>`;
    return;
  }
  root.innerHTML = `
    <div class="table-header"><div><span class="section-label">Ranked opportunities</span><strong>${rows.length} shown</strong></div><div>hide &gt; ${config.hideMultiplier}× refresh · stale &gt; ${config.staleMultiplier}×</div></div>
    <table class="arb-table">
      <thead><tr><th>Rank</th><th>Buy →</th><th>Sell</th><th>Gross</th><th>Net</th><th>Cleared</th><th>Buy VWAP</th><th>Sell VWAP</th><th>Buy age</th><th>Sell age</th></tr></thead>
      <tbody>${rows.map((row, i) => `
        <tr class="${row.buyVenueStaleMs > staleAfter || row.sellVenueStaleMs > staleAfter ? 'row-stale' : ''}">
          <td class="rank-cell">${i + 1}</td><td>${row.buyVenue}</td><td>${row.sellVenue}</td><td>${bps(row.grossBps)}</td>
          <td><span class="net-badge ${edgeClass(row.netBps)}">${bps(row.netBps)}</span></td><td>${usd(row.maxClearedNotional)}</td>
          <td>${price(row.buyVwap)}</td><td>${price(row.sellVwap)}</td>
          <td>${ageLabel(row.buyVenueStaleMs, staleAfter)}</td>
          <td>${ageLabel(row.sellVenueStaleMs, staleAfter)}</td>
        </tr>`).join('')}</tbody>
    </table>`;
}

function edgeClass(netBps: number): string {
  if (netBps > 30) return 'edge-strong';
  if (netBps >= 10) return 'edge-weak';
  if (netBps < 0) return 'edge-negative';
  return 'edge-muted';
}

function ageLabel(ms: number, staleAfter: number): string {
  return `${age(ms)}${ms > staleAfter ? ' <span class="stale-tag">stale</span>' : ''}`;
}

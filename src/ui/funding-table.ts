import type { FundingRow } from '../types';
import { age } from './format';

export interface FundingTableOptions {
  staleAfterMs: number;
}

export function renderFundingTable(root: HTMLElement, rows: FundingRow[], options: FundingTableOptions): void {
  if (rows.length === 0) {
    root.innerHTML = `<div class="empty-state"><strong>No funding data</strong><span>Waiting for perpetual funding rates. Adapters will populate this table when data arrives.</span></div>`;
    return;
  }

  const { staleAfterMs } = options;
  root.innerHTML = `
    <div class="table-header">
      <div><span class="section-label">Funding &amp; basis scanner</span><strong>${rows.length} contracts</strong></div>
      <div>stale &gt; ${(staleAfterMs / 1000).toFixed(0)}s · 8h funding window</div>
    </div>
    <table class="arb-table funding-table">
      <thead><tr>
        <th>Symbol</th><th>Venue</th><th>Funding bps/8h</th><th>Annualized</th>
        <th>Next funding</th><th>Basis bps</th><th>Age</th><th>Status</th>
      </tr></thead>
      <tbody>${rows.map((row) => renderRow(row, staleAfterMs)).join('')}</tbody>
    </table>`;
}

function renderRow(row: FundingRow, staleAfterMs: number): string {
  const isStale = row.ageMs > staleAfterMs || row.status === 'stale';
  const fundingClass = row.fundingBpsPer8h > 0 ? 'funding-positive' : row.fundingBpsPer8h < 0 ? 'funding-negative' : 'funding-neutral';
  return `
    <tr class="${isStale ? 'row-stale' : ''}">
      <td>${escape(row.symbol)}</td>
      <td>${escape(row.venue)}</td>
      <td class="${fundingClass}">${formatBps(row.fundingBpsPer8h)}</td>
      <td class="${fundingClass}">${formatPct(row.annualizedPct)}</td>
      <td>${formatCountdown(row.nextFundingMs)}</td>
      <td>${formatBasis(row.markIndexBasisBps)}</td>
      <td>${age(row.ageMs)}${isStale ? ' <span class="stale-tag">stale</span>' : ''}</td>
      <td><span class="status-pill status-${row.status}">${row.status.toUpperCase()}</span></td>
    </tr>`;
}

function formatBps(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} bps`;
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatBasis(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} bps`;
}

function formatCountdown(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—';
  if (ms <= 0) return 'now';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return ch;
    }
  });
}

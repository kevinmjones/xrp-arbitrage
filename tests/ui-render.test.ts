import { describe, expect, it, vi } from 'vitest';
import type { Config, SpreadOpportunity, VenueAdapter, VenueState } from '../src/types';
import { renderControls } from '../src/ui/controls';
import { renderStatus } from '../src/ui/status-bar';
import { renderTable } from '../src/ui/table';

const config: Config = {
  notionalUsd: 10_000,
  quote: 'USD',
  refreshIntervalMs: 5_000,
  staleMultiplier: 2,
  hideMultiplier: 4,
  topN: 10,
  enableGlobalVenues: false,
  fetchTimeoutMs: 4_000,
  proxyTimeoutMs: 8_000,
  selectedVenues: { Kraken: true, Binance: true },
  feeOverridesBps: { Kraken: 40, Binance: 10 },
};

const adapter = (venue: string, options: Partial<VenueAdapter> = {}): VenueAdapter => ({
  venue,
  supportedQuotes: new Set(['USD']),
  defaultMakerBps: 0,
  defaultTakerBps: 40,
  tier: 1,
  fetchBook: vi.fn(),
  ...options,
});

const row: SpreadOpportunity = {
  buyVenue: 'Kraken',
  sellVenue: 'Coinbase',
  quote: 'USD',
  notional: 10_000,
  buyVwap: 1.2,
  sellVwap: 1.22,
  grossBps: 166.6,
  netBps: 120.4,
  buyTakerBps: 40,
  sellTakerBps: 40,
  maxClearedNotional: 10_000,
  buyVenueStaleMs: 1_000,
  sellVenueStaleMs: 12_000,
};

describe('UI rendering', () => {
  it('renders JPL-style controls with global and venue state', () => {
    const root = document.createElement('section');
    renderControls(root, config, [adapter('Kraken'), adapter('Binance', { supportedQuotes: new Set(['USDT']) })], vi.fn());

    expect(root.textContent).toContain('Controls');
    expect(root.textContent).toContain('Global venues');
    expect(root.textContent).toContain('2/2 armed');
    expect(root.textContent).toContain('USD unsupported');
  });

  it('renders ranked spread rows with net-bps and stale indicators', () => {
    const root = document.createElement('section');
    renderTable(root, [row], config);

    expect(root.textContent).toContain('Ranked opportunities');
    expect(root.querySelector('.net-badge.edge-strong')?.textContent).toBe('120.4 bps');
    expect(root.querySelector('.row-stale')).not.toBeNull();
    expect(root.textContent).toContain('stale');
  });

  it('summarizes active venue freshness in the status bar', () => {
    const root = document.createElement('footer');
    const states = new Map<string, VenueState>([
      ['Kraken', { status: 'ok', error: null, updatedAt: 10_000, book: { venue: 'Kraken', symbol: 'XRP/USD', quote: 'USD', bids: [], asks: [], venueTs: null, fetchedAt: 9_500 } }],
      ['Binance', { status: 'error', error: 'boom', updatedAt: 10_000, book: null }],
    ]);

    renderStatus(root, states, config, [adapter('Kraken'), adapter('Binance', { tier: 2 })], 10_000);

    expect(root.textContent).toContain('1/1 fresh');
    expect(root.textContent).toContain('global off');
    expect(root.textContent).toContain('Kraken OK');
    expect(root.textContent).not.toContain('Binance ERR');
  });
});

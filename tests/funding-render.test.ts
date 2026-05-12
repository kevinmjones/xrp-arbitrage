import { describe, expect, it, vi } from 'vitest';
import type { FundingRow } from '../src/types';
import { renderFundingTable } from '../src/ui/funding-table';
import { renderViewTabs, type ViewMode } from '../src/ui/view-tabs';

const baseRow: FundingRow = {
  symbol: 'XRP-PERP',
  venue: 'Binance',
  fundingBpsPer8h: 1.25,
  annualizedPct: 13.7,
  nextFundingMs: 3_600_000,
  markIndexBasisBps: 4.2,
  ageMs: 2_500,
  status: 'ok',
};

describe('renderFundingTable', () => {
  it('renders header row with funding-specific columns', () => {
    const root = document.createElement('section');
    renderFundingTable(root, [baseRow], { staleAfterMs: 30_000 });

    const headers = Array.from(root.querySelectorAll('thead th')).map((th) => th.textContent?.trim());
    expect(headers).toEqual([
      'Symbol',
      'Venue',
      'Funding bps/8h',
      'Annualized',
      'Next funding',
      'Basis bps',
      'Age',
      'Status',
    ]);
  });

  it('renders one row per funding entry with formatted values', () => {
    const root = document.createElement('section');
    renderFundingTable(root, [baseRow], { staleAfterMs: 30_000 });

    const rows = root.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    const cells = Array.from(rows[0]!.querySelectorAll('td')).map((td) => td.textContent?.trim());
    expect(cells[0]).toBe('XRP-PERP');
    expect(cells[1]).toBe('Binance');
    expect(cells[2]).toContain('1.25');
    expect(cells[3]).toContain('13.7');
    expect(cells[4]).toContain('1h');
    expect(cells[5]).toContain('4.2');
    expect(cells[6]).toContain('2.5');
    expect(cells[7]?.toLowerCase()).toContain('ok');
  });

  it('shows em-dash when mark-index basis is missing', () => {
    const root = document.createElement('section');
    const row: FundingRow = { ...baseRow, markIndexBasisBps: null };
    renderFundingTable(root, [row], { staleAfterMs: 30_000 });

    const basisCell = root.querySelectorAll('tbody td')[5];
    expect(basisCell?.textContent?.trim()).toBe('—');
  });

  it('marks rows older than staleAfterMs with stale class', () => {
    const root = document.createElement('section');
    const row: FundingRow = { ...baseRow, ageMs: 90_000 };
    renderFundingTable(root, [row], { staleAfterMs: 30_000 });

    expect(root.querySelector('tbody tr.row-stale')).not.toBeNull();
  });

  it('renders empty state when there are no rows', () => {
    const root = document.createElement('section');
    renderFundingTable(root, [], { staleAfterMs: 30_000 });

    expect(root.querySelector('table')).toBeNull();
    expect(root.textContent).toMatch(/no funding/i);
  });

  it('colors positive and negative funding distinctly', () => {
    const root = document.createElement('section');
    const positive: FundingRow = { ...baseRow, symbol: 'XRP-PERP', fundingBpsPer8h: 2 };
    const negative: FundingRow = { ...baseRow, symbol: 'XRP-PERP-B', venue: 'OKX', fundingBpsPer8h: -1.5 };
    renderFundingTable(root, [positive, negative], { staleAfterMs: 30_000 });

    expect(root.querySelector('.funding-positive')).not.toBeNull();
    expect(root.querySelector('.funding-negative')).not.toBeNull();
  });
});

describe('renderViewTabs', () => {
  it('renders both view buttons with the active one marked', () => {
    const root = document.createElement('nav');
    renderViewTabs(root, 'spot', vi.fn());

    const buttons = Array.from(root.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent?.trim().toLowerCase())).toEqual(
      expect.arrayContaining(['spot spread', 'funding / basis']),
    );
    const active = root.querySelector('button.active');
    expect(active?.textContent?.toLowerCase()).toContain('spot');
  });

  it('invokes onChange with selected mode when a tab is clicked', () => {
    const root = document.createElement('nav');
    const onChange = vi.fn<(mode: ViewMode) => void>();
    renderViewTabs(root, 'spot', onChange);

    const fundingButton = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('funding'),
    );
    fundingButton?.click();

    expect(onChange).toHaveBeenCalledWith('funding');
  });

  it('does not call onChange when clicking the already-active tab', () => {
    const root = document.createElement('nav');
    const onChange = vi.fn();
    renderViewTabs(root, 'funding', onChange);

    const fundingButton = root.querySelector('button.active') as HTMLButtonElement | null;
    fundingButton?.click();

    expect(onChange).not.toHaveBeenCalled();
  });
});

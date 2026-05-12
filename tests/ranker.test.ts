import { describe, expect, it } from 'vitest';
import type { Config, OrderBook } from '../src/types';
import { rankOpportunities } from '../src/lib/ranker';

const config: Config = {
  notionalUsd: 1_000, quote: 'USD', refreshIntervalMs: 5_000, staleMultiplier: 2, hideMultiplier: 4, topN: 10,
  enableGlobalVenues: false, fetchTimeoutMs: 4_000, proxyTimeoutMs: 8_000, selectedVenues: {}, feeOverridesBps: { A: 0, B: 0 },
};
const book = (venue: string, bid: number, ask: number, fetchedAt = Date.now()): OrderBook => ({ venue, symbol: 'XRP/USD', quote: 'USD', bids: [[bid, 10_000]], asks: [[ask, 10_000]], venueTs: null, fetchedAt });

describe('rankOpportunities', () => {
  it('net equals gross when fees are zero', () => {
    const [row] = rankOpportunities([book('A', 2.49, 2.50), book('B', 2.60, 2.61)], config);
    expect(row.buyVenue).toBe('A');
    expect(row.sellVenue).toBe('B');
    expect(row.netBps).toBeCloseTo(row.grossBps, 8);
  });

  it('subtracts taker fees and sorts by net bps', () => {
    const rows = rankOpportunities([book('A', 2.49, 2.50), book('B', 2.60, 2.61)], { ...config, feeOverridesBps: { A: 40, B: 40 } });
    expect(rows[0].netBps).toBeLessThan(rows[0].grossBps);
  });

  it('hides stale rows beyond hide multiplier', () => {
    const rows = rankOpportunities([book('A', 2.49, 2.50, 0), book('B', 2.60, 2.61, 0)], config, 25_001);
    expect(rows).toHaveLength(0);
  });
});

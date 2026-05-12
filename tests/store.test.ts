import { describe, expect, it } from 'vitest';
import { BookStore } from '../src/store';

describe('BookStore', () => {
  it('publishes book updates', () => {
    const store = new BookStore(['A']);
    let calls = 0;
    store.subscribe(() => calls++);
    store.setBook({ venue: 'A', symbol: 'XRP/USD', quote: 'USD', bids: [[2.4, 1]], asks: [[2.5, 1]], venueTs: null, fetchedAt: 1 });
    expect(calls).toBe(1);
    expect(store.getBooks()).toHaveLength(1);
  });
});

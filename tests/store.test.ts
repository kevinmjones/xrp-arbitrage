import { describe, expect, it } from 'vitest'
import type { OrderBook } from '../src/types'
import { BookStore } from '../src/store'

const usdBook = (venue: string, fetchedAt = 1): OrderBook => ({
  venue,
  symbol: 'XRP/USD',
  quote: 'USD',
  bids: [[2.4, 1]],
  asks: [[2.5, 1]],
  venueTs: null,
  fetchedAt,
})

describe('BookStore', () => {
  it('publishes book updates with updated book and snapshot', () => {
    const store = new BookStore(['A'])
    const seen: Array<{ updated: OrderBook, snapshot: OrderBook[] }> = []
    store.subscribe((updated, snapshot) => seen.push({ updated, snapshot }))

    const book = usdBook('A')
    store.setBook(book)

    expect(seen).toHaveLength(1)
    expect(seen[0]).toEqual({ updated: book, snapshot: [book] })
    expect(store.getBooks()).toEqual([book])
  })

  it('keys books by venue and quote', () => {
    const store = new BookStore(['A'])
    const usd = usdBook('A', 1)
    const usdt: OrderBook = { ...usdBook('A', 2), symbol: 'XRP/USDT', quote: 'USDT' }

    store.upsert(usd)
    store.upsert(usdt)

    expect(store.get('A', 'USD')).toBe(usd)
    expect(store.get('A', 'USDT')).toBe(usdt)
    expect(store.getBooks()).toHaveLength(2)
  })

  it('returns isolated state snapshots and supports unsubscribe', () => {
    const store = new BookStore(['A'])
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)

    store.setLoading('A')
    unsubscribe()
    store.setError('A', new Error('network down'))

    const states = store.getStates()
    states.clear()

    expect(calls).toBe(1)
    expect(store.getStates().get('A')).toMatchObject({ status: 'error', error: 'network down' })
  })
})

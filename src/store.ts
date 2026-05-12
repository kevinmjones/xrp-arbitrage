import type { OrderBook, Quote, VenueState } from './types'

type LegacyListener = () => void
export type BookStoreListener = (updated: OrderBook, snapshot: OrderBook[]) => void
type Listener = LegacyListener | BookStoreListener

function keyFor(venue: string, quote: Quote): string {
  return `${venue}:${quote}`
}

export class BookStore {
  private readonly books = new Map<string, OrderBook>()
  private readonly states = new Map<string, VenueState>()
  private readonly listeners = new Set<Listener>()

  constructor(venues: string[] = []) {
    for (const venue of venues) {
      this.states.set(venue, { book: null, status: 'idle', error: null, updatedAt: null })
    }
  }

  upsert(book: OrderBook): void {
    this.books.set(keyFor(book.venue, book.quote), book)
    this.states.set(book.venue, { book, status: 'ok', error: null, updatedAt: Date.now() })
    this.emit(book)
  }

  setBook(book: OrderBook): void {
    this.upsert(book)
  }

  setLoading(venue: string): void {
    const previous = this.getState(venue)
    this.states.set(venue, { ...previous, status: 'loading', error: null })
    this.emit()
  }

  setError(venue: string, error: unknown): void {
    const previous = this.getState(venue)
    this.states.set(venue, {
      ...previous,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      updatedAt: Date.now(),
    })
    this.emit()
  }

  get(venue: string, quote: Quote): OrderBook | undefined {
    return this.books.get(keyFor(venue, quote))
  }

  all(): OrderBook[] {
    return [...this.books.values()]
  }

  getBooks(): OrderBook[] {
    return this.all()
  }

  getStates(): Map<string, VenueState> {
    return new Map(this.states)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  clear(): void {
    this.books.clear()
    this.states.clear()
    this.emit()
  }

  private getState(venue: string): VenueState {
    return this.states.get(venue) ?? { book: null, status: 'idle', error: null, updatedAt: null }
  }

  private emit(updated?: OrderBook): void {
    const snapshot = this.all()
    for (const listener of this.listeners) {
      if (updated) {
        ;(listener as BookStoreListener)(updated, snapshot)
      } else {
        ;(listener as LegacyListener)()
      }
    }
  }
}

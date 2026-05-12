export type Quote = 'USD' | 'USDT' | 'USDC' | 'EUR'
export type Side = 'buy' | 'sell'
export type PriceLevel = [price: number, size: number]
export type BookLevel = PriceLevel

export interface OrderBook {
  venue: string
  symbol: string
  quote: Quote
  bids: PriceLevel[]
  asks: PriceLevel[]
  venueTs: number | null
  fetchedAt: number
}

export interface VenueAdapter {
  venue: string
  supportedQuotes: ReadonlySet<Quote>
  defaultMakerBps: number
  defaultTakerBps: number
  tier: 1 | 2
  fetchBook(quote: Quote, signal: AbortSignal): Promise<OrderBook>
}

export interface VwapResult {
  side: Side
  notional: number
  filledBase: number
  filledQuote: number
  avgPrice: number
  levelsConsumed: number
  fullyFilled: boolean
}

export interface SpreadOpportunity {
  buyVenue: string
  sellVenue: string
  quote: Quote
  notional: number
  buyVwap: number
  sellVwap: number
  grossBps: number
  netBps: number
  buyTakerBps: number
  sellTakerBps: number
  maxClearedNotional: number
  buyVenueStaleMs: number
  sellVenueStaleMs: number
}

export interface FeeEntry {
  makerBps: number
  takerBps: number
}

export type FeeSchedule = Record<string, FeeEntry>

export interface Config {
  notionalUsd: number
  quote: Quote
  refreshIntervalMs: number
  staleMultiplier: number
  hideMultiplier: number
  topN: number
  enableGlobalVenues: boolean
  fetchTimeoutMs: number
  proxyTimeoutMs: number
  selectedVenues: Record<string, boolean>
  feeOverridesBps: Record<string, number>
}

export interface VenueState {
  book: OrderBook | null
  status: 'idle' | 'loading' | 'ok' | 'error'
  error: string | null
  updatedAt: number | null
}

export type FundingStatus = 'ok' | 'stale' | 'error' | 'loading' | 'idle'

export interface FundingRow {
  symbol: string
  venue: string
  fundingBpsPer8h: number
  annualizedPct: number
  nextFundingMs: number | null
  markIndexBasisBps: number | null
  ageMs: number
  status: FundingStatus
}

export interface FundingAdapter {
  venue: string
  fetchFunding(signal: AbortSignal): Promise<FundingRow[]>
}

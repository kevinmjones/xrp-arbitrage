import { describe, expect, it, vi } from 'vitest'
import { fetchJsonWithProxyFallback, proxyUrlFor } from '../../src/lib/proxy.ts'

describe('proxy layer', () => {
  it('encodes URLs for each configured proxy', () => {
    const url = 'https://api.binance.com/api/v3/depth?symbol=XRPUSDT&limit=500'
    expect(proxyUrlFor(url, 0)).toBe(`https://corsproxy.io/?url=${encodeURIComponent(url)}`)
    expect(proxyUrlFor(url, 1)).toBe(`https://thingproxy.freeboard.io/fetch/${url}`)
    expect(proxyUrlFor(url, 2)).toBe(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  })

  it('falls back through failed proxies', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 502, text: async () => 'bad gateway' })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    const json = await fetchJsonWithProxyFallback('https://example.com/book', new AbortController().signal, fetcher)
    expect(json).toEqual({ ok: true })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

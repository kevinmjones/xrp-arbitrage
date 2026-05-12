const PROXY_CHAIN = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

type FetchLike = (input: string, init?: RequestInit) => Promise<{
  ok: boolean
  status?: number
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}>

export function proxyUrlFor(url: string, index: number): string {
  const proxy = PROXY_CHAIN[index]
  if (!proxy) throw new Error(`Unknown proxy index: ${index}`)
  return proxy(url)
}

export async function fetchJsonWithProxyFallback(
  url: string,
  signal: AbortSignal,
  fetcher: FetchLike = fetch,
): Promise<unknown> {
  const errors: string[] = []

  for (let index = 0; index < PROXY_CHAIN.length; index += 1) {
    const proxiedUrl = proxyUrlFor(url, index)
    try {
      const response = await fetcher(proxiedUrl, { signal })
      if (!response.ok) {
        const body = response.text ? await response.text() : ''
        errors.push(`${proxiedUrl}: ${response.status ?? 'error'} ${body}`.trim())
        continue
      }
      if (!response.json) throw new Error('response does not expose json()')
      return response.json()
    } catch (error) {
      errors.push(`${proxiedUrl}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw new Error(`All proxies failed: ${errors.join('; ')}`)
}

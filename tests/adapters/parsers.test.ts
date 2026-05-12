import { describe, expect, it } from 'vitest';
import { parseBitfinex } from '../../src/adapters/bitfinex';
import { parseBitstamp } from '../../src/adapters/bitstamp';
import { parseBybit } from '../../src/adapters/bybit';
import { parseCoinbase } from '../../src/adapters/coinbase';
import { parseGemini } from '../../src/adapters/gemini';
import { parseKraken } from '../../src/adapters/kraken';
import { parseBinance } from '../../src/adapters/binance';
import { parseOkx } from '../../src/adapters/okx';
import { parseCryptoCom } from '../../src/adapters/crypto-com';
import { parseBinanceUs } from '../../src/adapters/binance-us';
import { parseBitget } from '../../src/adapters/bitget';

describe('adapter parsers', () => {
  it('parses Kraken legacy wrapper', () => {
    const book = parseKraken({ result: { XXRPZUSD: { bids: [['2.4','10','1']], asks: [['2.5','20','2']] } } }, 'USD', 10);
    expect(book.bids[0]).toEqual([2.4, 10]); expect(book.asks[0]).toEqual([2.5, 20]); expect(book.venueTs).toBe(2000);
  });
  it('parses Coinbase tuples', () => {
    const book = parseCoinbase({ bids: [['2.4','10',1]], asks: [['2.5','20',1]], time: '2026-01-01T00:00:00.000Z' }, 'USD', 10);
    expect(book.bids[0]).toEqual([2.4, 10]);
  });
  it('parses Bitstamp strings', () => {
    const book = parseBitstamp({ bids: [['2.4','10']], asks: [['2.5','20']], timestamp: '2' }, 'USD', 10);
    expect(book.venueTs).toBe(2000);
  });
  it('parses Gemini object levels', () => {
    const book = parseGemini({ bids: [{ price: '2.4', amount: '10', timestamp: '1' }], asks: [{ price: '2.5', amount: '20', timestamp: '2' }] }, 'USD', 10);
    expect(book.asks[0]).toEqual([2.5, 20]);
  });
  it('splits Bitfinex signed amounts', () => {
    const book = parseBitfinex([[2.4, 1, 10], [2.5, 1, -20]], 'USD', 10);
    expect(book.bids[0]).toEqual([2.4, 10]); expect(book.asks[0]).toEqual([2.5, 20]);
  });
  it('parses Binance tuples', () => {
    expect(parseBinance({ bids: [['2.4','10']], asks: [['2.5','20']] }, 'USDT', 10).quote).toBe('USDT');
  });
  it('parses OKX wrapper', () => {
    const book = parseOkx({ data: [{ bids: [['2.4','10','0','1']], asks: [['2.5','20','0','1']], ts: '123' }] }, 'USDT', 10);
    expect(book.venueTs).toBe(123);
  });
  it('parses Bybit v5 wrapper', () => {
    const book = parseBybit({ result: { b: [['2.4','10']], a: [['2.5','20']], ts: '123' } }, 'USDT', 10);
    expect(book.bids[0]).toEqual([2.4, 10]);
  });
  it('parses Crypto.com wrapper', () => {
    const book = parseCryptoCom({ code: 0, result: { data: [{ bids: [['2.4','10','1']], asks: [['2.5','20','1']], t: 123 }] } }, 'USD', 10);
    expect(book.venue).toBe('Crypto.com');
    expect(book.asks[0]).toEqual([2.5, 20]);
    expect(book.venueTs).toBe(123);
  });
  it('parses Binance.US tuples', () => {
    const book = parseBinanceUs({ bids: [['2.4','10']], asks: [['2.5','20']] }, 'USDT', 10);
    expect(book.venue).toBe('Binance.US');
    expect(book.bids[0]).toEqual([2.4, 10]);
  });
  it('parses Bitget wrapper', () => {
    const book = parseBitget({ code: '00000', data: { bids: [['2.4','10']], asks: [['2.5','20']], ts: '123' } }, 'USDT', 10);
    expect(book.venue).toBe('Bitget');
    expect(book.asks[0]).toEqual([2.5, 20]);
  });
});

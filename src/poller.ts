import type { Config, VenueAdapter } from './types';
import { BookStore } from './store';
import { activeAdapters } from './lib/venues';

export class Poller {
  private timer: number | null = null;
  private controller: AbortController | null = null;
  private adapters: VenueAdapter[];
  private store: BookStore;
  private getConfig: () => Config;

  constructor(adapters: VenueAdapter[], store: BookStore, getConfig: () => Config) {
    this.adapters = adapters;
    this.store = store;
    this.getConfig = getConfig;
  }

  start(): void {
    void this.tick();
    this.timer = window.setInterval(() => void this.tick(), this.getConfig().refreshIntervalMs);
  }

  restart(): void {
    this.stop();
    this.start();
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.controller?.abort();
  }

  async tick(): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const config = this.getConfig();
    const active = activeAdapters(this.adapters, config);

    await Promise.allSettled(active.map(async (adapter) => {
      this.store.setLoading(adapter.venue);
      try {
        const book = await adapter.fetchBook(config.quote, controller.signal);
        this.store.setBook(book);
      } catch (error) {
        if (!controller.signal.aborted) this.store.setError(adapter.venue, error);
      }
    }));
  }
}

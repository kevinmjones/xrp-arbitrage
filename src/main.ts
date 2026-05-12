import './ui/styles.css';
import { adapters } from './adapters';
import { loadConfig, saveConfig } from './config';
import { rankOpportunities } from './lib/ranker';
import { isAdapterActive } from './lib/venues';
import { Poller } from './poller';
import { BookStore } from './store';
import { renderControls } from './ui/controls';
import { renderFundingTable } from './ui/funding-table';
import { renderStatus } from './ui/status-bar';
import { renderTable } from './ui/table';
import { renderViewTabs, type ViewMode } from './ui/view-tabs';
import type { FundingRow } from './types';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app missing');

let config = loadConfig(adapters.map((adapter) => adapter.venue));
let viewMode: ViewMode = 'spot';
const fundingRows: FundingRow[] = [];
const store = new BookStore(adapters.map((adapter) => adapter.venue));
const poller = new Poller(adapters, store, () => config);

app.innerHTML = `
  <main class="shell">
    <header class="topbar"><div><h1>XRP Arb Calc</h1><p>Depth-weighted cross-exchange spread after taker fees</p></div><div class="live-dot"><span></span> live</div></header>
    <nav id="view-tabs" class="panel view-tabs-panel"></nav>
    <section id="controls" class="panel"></section>
    <section class="panel"><div id="table"></div></section>
    <footer id="status" class="status panel"></footer>
  </main>`;

const tabs = document.querySelector<HTMLElement>('#view-tabs')!;
const controls = document.querySelector<HTMLElement>('#controls')!;
const table = document.querySelector<HTMLElement>('#table')!;
const status = document.querySelector<HTMLElement>('#status')!;

function updateConfig(next: typeof config, restart = false): void {
  config = next;
  saveConfig(config);
  renderControls(controls, config, adapters, updateConfig);
  render();
  if (restart) poller.restart();
}

function render(): void {
  const now = Date.now();
  if (viewMode === 'spot') {
    const feeSchedule = Object.fromEntries(adapters.map((adapter) => [
      adapter.venue,
      { makerBps: adapter.defaultMakerBps, takerBps: config.feeOverridesBps[adapter.venue] ?? adapter.defaultTakerBps },
    ]));
    const activeVenueSet = new Set(adapters
      .filter((adapter) => isAdapterActive(adapter, config))
      .map((adapter) => adapter.venue));
    const rows = rankOpportunities({
      books: store.getBooks().filter((book) => book.quote === config.quote && activeVenueSet.has(book.venue)),
      notional: config.notionalUsd,
      feeSchedule,
      now,
      limit: config.topN,
      refreshIntervalMs: config.refreshIntervalMs,
      hideMultiplier: config.hideMultiplier,
    });
    renderTable(table, rows, config);
  } else {
    renderFundingTable(table, fundingRows, {
      staleAfterMs: config.refreshIntervalMs * config.staleMultiplier,
    });
  }
  renderStatus(status, store.getStates(), config, adapters);
}

function switchView(mode: ViewMode): void {
  viewMode = mode;
  renderViewTabs(tabs, viewMode, switchView);
  render();
}

renderViewTabs(tabs, viewMode, switchView);
renderControls(controls, config, adapters, updateConfig);
store.subscribe(render);
render();
poller.start();

export function usd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function price(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 5 });
}

export function bps(value: number): string {
  return `${value.toFixed(1)} bps`;
}

export function age(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

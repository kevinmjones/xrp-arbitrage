export type ViewMode = 'spot' | 'funding';

interface TabSpec {
  mode: ViewMode;
  label: string;
}

const TABS: readonly TabSpec[] = [
  { mode: 'spot', label: 'Spot Spread' },
  { mode: 'funding', label: 'Funding / Basis' },
];

export function renderViewTabs(root: HTMLElement, active: ViewMode, onChange: (mode: ViewMode) => void): void {
  root.classList.add('view-tabs');
  root.innerHTML = TABS.map((tab) => `
    <button type="button" data-mode="${tab.mode}" class="${tab.mode === active ? 'active' : ''}">${tab.label}</button>
  `).join('');

  root.onclick = (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-mode]');
    if (!target) return;
    const mode = target.dataset.mode as ViewMode;
    if (mode === active) return;
    onChange(mode);
  };
}

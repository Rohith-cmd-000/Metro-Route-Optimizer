import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { METRO_LINES, STATIONS } from '@/data/metroData';
import type { Station } from '@/types/metro';

interface StationSelectProps {
  label: string;
  value: string | null;
  onChange: (stationId: string) => void;
  placeholder?: string;
  excludeId?: string | null;
}

function LineDots({ lines }: { lines: Station['lines'] }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {lines.map((l) => (
        <span
          key={l}
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: METRO_LINES[l].color }}
        />
      ))}
    </span>
  );
}

export function StationSelect({
  label,
  value,
  onChange,
  placeholder = 'Select a station',
  excludeId,
}: StationSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => STATIONS.find((s) => s.id === value) ?? null,
    [value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? STATIONS.filter((s) => s.name.toLowerCase().includes(q))
      : STATIONS;
    return excludeId ? list.filter((s) => s.id !== excludeId) : list;
  }, [query, excludeId]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) pick(filtered[activeIndex].id);
      return;
    }
  }

  // Scroll active item into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const listId = `station-list-${label.replace(/\s/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-autocomplete="list"
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <LineDots lines={selected.lines} />
              <span className="truncate text-slate-900">{selected.name}</span>
              {selected.isInterchange && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Interchange
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="relative z-20">
          <div className="absolute mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stations…"
                role="combobox"
                aria-expanded={true}
                aria-controls={listId}
                aria-activedescendant={
                  filtered[activeIndex]
                    ? `${listId}-${activeIndex}`
                    : undefined
                }
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              className="max-h-60 overflow-y-auto py-1"
            >
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-400">
                  No stations match &ldquo;{query}&rdquo;.
                </li>
              )}
              {filtered.map((s, i) => (
                <li key={s.id} id={`${listId}-${i}`} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(s.id)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition ${
                      i === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LineDots lines={s.lines} />
                      <span className="text-slate-800">{s.name}</span>
                    </span>
                    {s.isInterchange && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Interchange
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

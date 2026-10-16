"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icons";
import { getSearchIndex } from "@/lib/search-actions";
import { groupHits, search, staticItems, type SearchItem, type SearchKind } from "@/lib/search";

const STALE_MS = 60_000;
const MAX_DROPDOWN = 8;

const kindIcon: Record<SearchKind, IconName> = {
  page: "grid",
  course: "book",
  lesson: "play",
  resource: "pdf",
  help: "help",
  person: "users",
  "admin-course": "stack",
};

export function SearchBox({ demoMode = false }: { demoMode?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [index, setIndex] = useState<SearchItem[] | null>(demoMode ? staticItems(false) : null);
  const [loading, setLoading] = useState(false);
  const loadedAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (demoMode || loading || Date.now() - loadedAt.current < STALE_MS) return;
    setLoading(true);
    try {
      setIndex(await getSearchIndex());
      loadedAt.current = Date.now();
    } catch {
      setIndex((i) => i ?? staticItems(false));
    } finally {
      setLoading(false);
    }
  }, [demoMode, loading]);

  const hits = useMemo(() => (index ? search(index, q, MAX_DROPDOWN) : []), [index, q]);
  // Flattened in display order so arrow keys follow what's on screen.
  const groups = useMemo(() => groupHits(hits), [hits]);
  const ordered = useMemo(() => groups.flatMap((g) => g.hits), [groups]);
  const term = q.trim();

  useEffect(() => setActive(-1), [q]);

  // "/" focuses search from anywhere (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(href);
  }

  function seeAll() {
    if (!term || demoMode) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(ordered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && ordered[active]) go(ordered[active].href);
      else if (ordered.length === 1) go(ordered[0].href);
      else seeAll();
    } else if (e.key === "Escape") {
      if (q) setQ("");
      else inputRef.current?.blur();
      setOpen(false);
    }
  }

  const showPanel = open && term.length > 0;
  const activeId = active >= 0 ? `search-opt-${active}` : undefined;

  return (
    <div className="search-wrap" ref={wrapRef}>
      <label className="search">
        <Icon name="search" />
        <input
          ref={inputRef}
          id="search"
          type="search"
          placeholder="Search lessons and resources"
          aria-label="Search lessons, resources and help"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            void load();
          }}
          onKeyDown={onKeyDown}
        />
        <kbd className="search-key" aria-hidden="true">/</kbd>
      </label>

      {showPanel && (
        <div className="search-panel" id="search-results" role="listbox" aria-label="Search results">
          {!index || (loading && !hits.length) ? (
            <p className="search-empty">Searching…</p>
          ) : !hits.length ? (
            <p className="search-empty">No matches for &ldquo;{term}&rdquo;.</p>
          ) : (
            groups.map((g) => (
              <div key={g.kind} role="group" aria-label={g.label}>
                <div className="search-group">{g.label}</div>
                {g.hits.map((h) => {
                  const i = ordered.indexOf(h);
                  return (
                    <div
                      key={`${h.kind}-${h.href}`}
                      id={`search-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className={`search-opt${i === active ? " active" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(h.href)}
                      onMouseEnter={() => setActive(i)}
                    >
                      <span className="search-icon" aria-hidden="true"><Icon name={h.locked ? "lock" : kindIcon[h.kind]} /></span>
                      <span className="search-text">
                        <span className="search-title">{h.title}</span>
                        {(h.snippet || h.subtitle) && <span className="search-sub">{h.snippet ?? h.subtitle}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          {!demoMode && hits.length > 0 && (
            <button type="button" className="search-all" onMouseDown={(e) => e.preventDefault()} onClick={seeAll}>
              See all results for &ldquo;{term}&rdquo; <Icon name="arrow" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

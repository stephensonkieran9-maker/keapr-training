"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";
import { getMyNotifications, markNotificationsRead, type NotificationItem } from "@/lib/notification-actions";

const REFRESH_MS = 60_000;

const demoItems: NotificationItem[] = [
  { id: "d1", kind: "course_assigned", title: "New course: Getting started with Keapr Training", body: "It's been added to your training. Start whenever you're ready.", link: null, createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(), read: false },
  { id: "d2", kind: "welcome", title: "Welcome to Keapr Training", body: "Sample notification for the demo.", link: null, createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(), read: true },
];

function ago(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "Yesterday" : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const kindIcon: Record<string, "book" | "award" | "redo" | "circle-check" | "info" | "help"> = {
  course_assigned: "book",
  course_completed: "award",
  progress_reset: "redo",
  lesson_marked: "circle-check",
  problem_report: "help",
};

export function NotificationsMenu({ demoMode = false }: { demoMode?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(demoMode ? demoItems : []);
  const [unread, setUnread] = useState(demoMode ? 1 : 0);
  const [loaded, setLoaded] = useState(demoMode);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    if (demoMode) return;
    try {
      const r = await getMyNotifications();
      setItems(r.items);
      setUnread(r.unread);
    } catch {
      /* offline or signed out: keep what we have */
    } finally {
      setLoaded(true);
    }
  }, [demoMode]);

  // Load on start, every minute while the tab is visible, and on return to the tab.
  useEffect(() => {
    if (demoMode) return;
    void refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [demoMode, refresh]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function markRead(ids: string[] | "all") {
    setItems((list) => list.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, read: true } : n)));
    setUnread((u) => (ids === "all" ? 0 : Math.max(0, u - items.filter((n) => !n.read && ids.includes(n.id)).length)));
    if (!demoMode) void markNotificationsRead(ids).catch(() => undefined);
  }

  function openItem(n: NotificationItem) {
    if (!n.read) markRead([n.id]);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  return (
    <div className="notif" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="iconbtn notif-btn"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void refresh();
        }}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="notif-count" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-head">
            <h2>Notifications</h2>
            {unread > 0 && <button type="button" className="mini" onClick={() => markRead("all")}>Mark all as read</button>}
          </div>
          {!loaded ? (
            <p className="notif-empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="notif-empty">Nothing yet. You'll see new courses and updates here.</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`notif-item${n.read ? "" : " unread"}`} onClick={() => openItem(n)}>
                    <span className="notif-icon" aria-hidden="true"><Icon name={kindIcon[n.kind] ?? "info"} /></span>
                    <span className="notif-text">
                      <span className="notif-title">{n.title}</span>
                      {n.body && <span className="notif-body">{n.body}</span>}
                      <span className="notif-time">{ago(n.createdAt)}{!n.read && <span className="sr-only"> · unread</span>}</span>
                    </span>
                    {!n.read && <span className="notif-dot" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

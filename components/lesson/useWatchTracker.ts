"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveVideoProgress } from "@/lib/lesson-actions";
import { meetsWatchRequirement, mergeRanges, watchedSeconds, type Range } from "@/lib/video-ranges";

const SAVE_EVERY_MS = 10_000;
const MAX_NORMAL_STEP = 2; // seconds between time updates that still count as normal playback

/** Tracks which parts of the video actually played and saves them to the
 * server periodically, on pause, on seek and when the page is hidden. */
export function useWatchTracker(opts: {
  lessonId: string;
  duration: number;
  requiredRatio: number;
  initialRanges: Range[];
  initialUnlocked: boolean;
  /** Admin preview: track locally, never save. */
  preview?: boolean;
}) {
  const { lessonId, duration, requiredRatio, preview = false } = opts;
  const [ranges, setRanges] = useState<Range[]>(() => mergeRanges(opts.initialRanges, duration));
  const [unlocked, setUnlocked] = useState(opts.initialUnlocked);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Watch-only lessons: set when the server records the lesson as complete.
  const [completion, setCompletion] = useState<{
    nextLessonId: string | null;
    courseCompleted: boolean;
    nextCourse?: { courseId: string; title: string; lessonId: string | null } | null;
  } | null>(null);

  const pending = useRef<Range[]>([]);
  const current = useRef<Range | null>(null);
  const lastTime = useRef<number | null>(null);
  const position = useRef(0);
  const saving = useRef(false);
  const unlockedRef = useRef(opts.initialUnlocked);

  const closeCurrent = () => {
    if (current.current && current.current[1] > current.current[0]) pending.current.push(current.current);
    current.current = null;
  };

  const flush = useCallback(async () => {
    if (saving.current) return;
    closeCurrent();
    const batch = pending.current;
    pending.current = [];
    if (preview) {
      setRanges((r) => {
        const merged = mergeRanges([...r, ...batch], duration);
        if (!unlockedRef.current && meetsWatchRequirement(watchedSeconds(merged), duration, requiredRatio)) {
          unlockedRef.current = true;
          setUnlocked(true);
        }
        return merged;
      });
      return;
    }
    saving.current = true;
    try {
      const res = await saveVideoProgress(lessonId, batch, position.current);
      if (res.ok) {
        setSaveError(null);
        if (res.quizUnlocked && !unlockedRef.current) {
          unlockedRef.current = true;
          setUnlocked(true);
        }
        if (res.lessonCompleted) setCompletion({ nextLessonId: res.nextLessonId ?? null, courseCompleted: Boolean(res.courseCompleted), nextCourse: res.nextCourse ?? null });
      } else {
        pending.current = [...batch, ...pending.current];
        setSaveError(res.error ?? "Your progress couldn't be saved.");
      }
    } catch {
      pending.current = [...batch, ...pending.current];
      setSaveError("Your progress couldn't be saved. Check your connection; it will retry.");
    } finally {
      saving.current = false;
    }
  }, [lessonId, preview, duration, requiredRatio]);

  /** Call on every time update while the video is playing. */
  const onTime = useCallback(
    (t: number, playing: boolean) => {
      position.current = t;
      const last = lastTime.current;
      if (playing && last !== null && t >= last && t - last <= MAX_NORMAL_STEP) {
        if (!current.current) current.current = [last, t];
        else current.current[1] = t;
        const live = mergeRanges([...ranges, ...pending.current, current.current], duration);
        const w = watchedSeconds(live);
        if (!unlockedRef.current && meetsWatchRequirement(w, duration, requiredRatio)) void flush();
        // Keep the on-screen total moving without re-rendering on every frame.
        if (Math.floor(w) !== Math.floor(watchedSeconds(ranges))) setRanges(live);
      } else if (last !== null && Math.abs(t - last) > MAX_NORMAL_STEP) {
        closeCurrent();
      }
      lastTime.current = t;
    },
    [duration, requiredRatio, ranges, flush],
  );

  const onSeek = useCallback((t: number) => {
    closeCurrent();
    lastTime.current = t;
    position.current = t;
  }, []);

  const onPause = useCallback(() => {
    void flush();
  }, [flush]);

  useEffect(() => {
    const id = setInterval(() => {
      if (current.current || pending.current.length) void flush();
    }, SAVE_EVERY_MS);
    const hide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", hide);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", hide);
    };
  }, [flush]);

  /** Preview only: open the quiz without watching. */
  const unlock = useCallback(() => {
    unlockedRef.current = true;
    setUnlocked(true);
  }, []);

  const watched = Math.min(duration, watchedSeconds(ranges));
  return { watched, unlocked, saveError, completion, onTime, onSeek, onPause, unlock };
}

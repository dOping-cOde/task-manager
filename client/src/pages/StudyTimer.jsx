import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiTrash2,
  FiClock,
  FiPlusCircle,
  FiTarget,
} from "react-icons/fi";

import {
  fetchSessions,
  addSession,
  deleteSession,
} from "../features/sessions/sessionsSlice";
import { CATEGORIES, getCategory } from "../lib/constants";
import { dateKey, todayKey } from "../lib/dates";

// Default Pomodoro durations (minutes) when the user has no preferences.
const DEFAULTS = { focusMin: 25, shortBreakMin: 5, longBreakMin: 15 };

const MODES = [
  { value: "focus", label: "Focus", type: "focus" },
  { value: "short", label: "Short break", type: "short" },
  { value: "long", label: "Long break", type: "long" },
];

// Short beep via the Web Audio API — fully best-effort, never throws.
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    // Audio may be blocked — ignore silently.
  }
};

const fmt = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Compact relative label for a session date.
const relativeDate = (iso) => {
  const key = dateKey(iso);
  const today = todayKey();
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  if (key === today)
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  if (key === yesterday) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const StudyTimer = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.sessions);
  const prefs = useSelector((s) => s.auth.user?.preferences?.pomodoro);

  const durations = useMemo(
    () => ({
      focus: Math.max(1, Number(prefs?.focusMin) || DEFAULTS.focusMin),
      short: Math.max(1, Number(prefs?.shortBreakMin) || DEFAULTS.shortBreakMin),
      long: Math.max(1, Number(prefs?.longBreakMin) || DEFAULTS.longBreakMin),
    }),
    [prefs]
  );

  const [mode, setMode] = useState("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durations.focus * 60);
  const [subject, setSubject] = useState(CATEGORIES[0].value);
  const [note, setNote] = useState("");

  const intervalRef = useRef(null);
  // Keep latest values for the interval tick / completion handler.
  const stateRef = useRef({ mode, subject, note });
  stateRef.current = { mode, subject, note };

  const totalSeconds = durations[mode] * 60;

  // Reset the clock whenever the mode (or its configured duration) changes.
  useEffect(() => {
    setRunning(false);
    setSecondsLeft(durations[mode] * 60);
  }, [mode, durations]);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const logFocus = useCallback(
    (minutes) => {
      const { subject: subj, note: n } = stateRef.current;
      dispatch(
        addSession({
          subject: subj,
          durationMin: minutes,
          type: "focus",
          note: n.trim(),
        })
      ).then((res) => {
        if (addSession.fulfilled.match(res)) {
          toast.success(`Logged ${minutes} min of ${getCategory(subj).short}`, {
            icon: "✅",
          });
        } else {
          toast.error(res.payload || "Could not log session");
        }
      });
    },
    [dispatch]
  );

  // Fires once the countdown reaches zero.
  const handleComplete = useCallback(() => {
    setRunning(false);
    playBeep();
    const { mode: m } = stateRef.current;

    if (m === "focus") {
      logFocus(durations.focus);
      toast("Focus done — take a short break ☕", { icon: "🎉" });
      setMode("short");
    } else {
      toast("Break over — back to focus 🔁", { icon: "💪" });
      setMode("focus");
    }
  }, [durations.focus, logFocus]);

  // The ticking interval.
  useEffect(() => {
    if (!running) return undefined;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // Defer side effects out of the state updater.
          setTimeout(handleComplete, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, handleComplete]);

  const toggle = () => {
    if (secondsLeft === 0) setSecondsLeft(totalSeconds);
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const logManually = () => {
    const elapsedSec = totalSeconds - secondsLeft;
    const minutes = Math.max(1, Math.round(elapsedSec / 60)) || durations.focus;
    const finalMinutes = elapsedSec > 0 ? minutes : durations.focus;
    logFocus(finalMinutes);
    reset();
  };

  // Today's focus totals.
  const today = useMemo(() => {
    const key = todayKey();
    const todays = items.filter(
      (s) => s.type === "focus" && dateKey(s.date) === key
    );
    const minutes = todays.reduce((sum, s) => sum + (s.durationMin || 0), 0);
    return { minutes, count: todays.length };
  }, [items]);

  const recent = useMemo(() => items.slice(0, 8), [items]);

  // Circular progress ring geometry.
  const R = 120;
  const CIRC = 2 * Math.PI * R;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const dashOffset = CIRC * (1 - progress);

  const handleDelete = (id) => {
    dispatch(deleteSession(id)).then((res) => {
      if (deleteSession.fulfilled.match(res)) {
        toast.success("Session removed");
      } else {
        toast.error(res.payload || "Could not delete session");
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Study Timer ⏳
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Focus in Pomodoro intervals and track every minute you put in.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Timer card */}
        <div className="card p-6 lg:col-span-3">
          {/* Mode switch */}
          <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/50">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition sm:px-4 ${
                  mode === m.value
                    ? "bg-brand-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Ring */}
          <div className="flex flex-col items-center">
            <div className="relative h-72 w-72">
              <svg
                viewBox="0 0 280 280"
                className="h-full w-full -rotate-90"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <circle
                  cx="140"
                  cy="140"
                  r={R}
                  fill="none"
                  strokeWidth="16"
                  className="stroke-slate-200 dark:stroke-slate-700"
                />
                <circle
                  cx="140"
                  cy="140"
                  r={R}
                  fill="none"
                  strokeWidth="16"
                  strokeLinecap="round"
                  stroke="url(#ringGrad)"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 0.5s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-5xl font-extrabold tabular-nums text-slate-900 dark:text-white sm:text-6xl">
                  {fmt(secondsLeft)}
                </span>
                <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {MODES.find((m) => m.value === mode)?.label}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={toggle}
                className="btn-primary min-w-[8rem] justify-center text-base"
              >
                {running ? <FiPause /> : <FiPlay />}
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={reset}
                className="btn-ghost border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                title="Reset timer"
              >
                <FiRotateCcw />
                Reset
              </button>
            </div>

            {mode === "focus" && (
              <button
                onClick={logManually}
                className="btn-ghost mt-3 text-brand-600 dark:text-brand-400"
                title="Log the focus time elapsed so far"
              >
                <FiPlusCircle />
                Log session manually
              </button>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-6 lg:col-span-2">
          {/* Session setup */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              This session
            </h2>

            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-field mb-4"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.value}
                </option>
              ))}
            </select>

            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Note <span className="text-slate-400">(optional)</span>
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What are you working on?"
              className="input-field"
            />
          </div>

          {/* Today's focus */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Today's focus
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock className="text-sm" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Minutes
                  </span>
                </div>
                <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
                  {today.minutes}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiTarget className="text-sm" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Sessions
                  </span>
                </div>
                <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
                  {today.count}
                </p>
              </div>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Recent sessions
            </h2>

            {status === "loading" && items.length === 0 ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700/50"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                No sessions yet — start the timer to log your first one.
              </p>
            ) : (
              <ul className="space-y-2">
                {recent.map((s) => {
                  const cat = getCategory(s.subject);
                  return (
                    <li
                      key={s._id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${cat.color}`}
                      >
                        {cat.emoji} {cat.short}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {s.durationMin} min
                          {s.type !== "focus" && (
                            <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
                              ({s.type})
                            </span>
                          )}
                        </p>
                        {s.note && (
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {s.note}
                          </p>
                        )}
                      </div>
                      <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                        {relativeDate(s.date)}
                      </span>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                        title="Delete session"
                      >
                        <FiTrash2 />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
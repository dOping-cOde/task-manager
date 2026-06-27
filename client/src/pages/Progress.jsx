import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiZap, FiTrendingUp, FiCheckCircle, FiTarget } from "react-icons/fi";

import { fetchStats } from "../features/gamification/gamificationSlice";
import { fetchTasks } from "../features/tasks/tasksSlice";
import { CATEGORIES } from "../lib/constants";
import { ACHIEVEMENTS, ACHIEVEMENT_ORDER } from "../lib/achievements";

const Progress = () => {
  const dispatch = useDispatch();
  const g = useSelector((s) => s.gamification);
  const { items } = useSelector((s) => s.tasks);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchTasks());
  }, [dispatch]);

  const unlocked = new Set(g.achievements);

  // Per-subject totals from the task list (completed / total).
  const bySubject = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.value] = { total: 0, done: 0 }));
    items.forEach((t) => {
      const m = map[t.category] || map["General"];
      m.total += 1;
      if (t.completed) m.done += 1;
    });
    return map;
  }, [items]);

  const completionRate =
    items.length === 0
      ? 0
      : Math.round((items.filter((t) => t.completed).length / items.length) * 100);

  return (
    <div className="space-y-6">
      {/* Hero: level + XP */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/15 text-3xl font-extrabold backdrop-blur">
              {g.level}
            </div>
            <div>
              <p className="text-sm font-medium text-brand-100">Current level</p>
              <p className="text-3xl font-extrabold">Level {g.level}</p>
              <p className="mt-1 text-sm text-brand-100">
                {g.xp} XP total · {g.xpForLevelSpan - g.xpIntoLevel} XP to level{" "}
                {g.level + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-2xl font-extrabold leading-none">
                {g.streak.current}
              </p>
              <p className="text-xs text-brand-100">
                day streak · best {g.streak.longest}
              </p>
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-brand-100">
            <span>Level {g.level}</span>
            <span>
              {g.xpIntoLevel}/{g.xpForLevelSpan} XP
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${Math.min(g.progressPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={FiZap} label="Total XP" value={g.xp} tone="text-brand-600" />
        <MiniStat
          icon={FiCheckCircle}
          label="Tasks done"
          value={g.completedCount}
          tone="text-emerald-600"
        />
        <MiniStat
          icon={FiTrendingUp}
          label="Best streak"
          value={g.streak.longest}
          tone="text-orange-600"
        />
        <MiniStat
          icon={FiTarget}
          label="Completion"
          value={`${completionRate}%`}
          tone="text-violet-600"
        />
      </div>

      {/* Per-subject progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Subject progress
        </h3>
        <div className="space-y-4">
          {CATEGORIES.map((c) => {
            const s = bySubject[c.value];
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <div key={c.value}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {c.emoji} {c.value}
                  </span>
                  <span className="text-slate-400">
                    {s.done}/{s.total}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Achievements</h3>
          <span className="text-sm font-medium text-slate-400">
            {unlocked.size}/{ACHIEVEMENT_ORDER.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ACHIEVEMENT_ORDER.map((key) => {
            const a = ACHIEVEMENTS[key];
            const has = unlocked.has(key);
            return (
              <div
                key={key}
                className={`flex flex-col items-center rounded-2xl border p-4 text-center transition ${
                  has
                    ? "border-brand-200 bg-brand-50"
                    : "border-slate-100 bg-slate-50 opacity-60 grayscale"
                }`}
                title={a.desc}
              >
                <span className="text-3xl">{has ? a.emoji : "🔒"}</span>
                <p className="mt-2 text-sm font-bold text-slate-800">{a.title}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
                  {a.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className={`mb-2 flex items-center gap-2 ${tone}`}>
      <Icon className="text-lg" />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </div>
    <p className="text-2xl font-extrabold text-slate-900">{value}</p>
  </div>
);

export default Progress;
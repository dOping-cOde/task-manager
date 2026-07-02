import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiScissors, FiRotateCcw } from "react-icons/fi";

import {
  fetchYearTracker,
  saveYearTracker,
  setMarkedDays,
} from "../features/yearTracker/yearTrackerSlice";
import { useConfirm } from "../components/ConfirmProvider";

const MS_PER_DAY = 86400000;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// 0-based day-of-year index for a given month/day, using UTC to sidestep DST.
const dayOfYearIndex = (year, month, day) =>
  Math.floor((Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / MS_PER_DAY);

const daysInYear = (year) => dayOfYearIndex(year, 11, 31) + 1;

const YearTracker = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { markedDays, status } = useSelector((s) => s.yearTracker);

  const now = new Date();
  const year = now.getFullYear();
  const totalDays = daysInYear(year);
  const todayIndex =
    now.getFullYear() === year
      ? dayOfYearIndex(year, now.getMonth(), now.getDate())
      : -1;

  useEffect(() => {
    dispatch(fetchYearTracker(year));
  }, [dispatch, year]);

  const markedSet = useMemo(() => new Set(markedDays), [markedDays]);

  const persist = (nextArr) => {
    dispatch(setMarkedDays(nextArr)); // optimistic
    dispatch(saveYearTracker({ year, markedDays: nextArr }));
  };

  const toggleDay = (index) => {
    const next = markedSet.has(index)
      ? markedDays.filter((d) => d !== index)
      : [...markedDays, index];
    persist(next);
  };

  const cutPassedDays = async () => {
    if (todayIndex <= 0) {
      toast("No passed days to cut yet.", { icon: "🗓️" });
      return;
    }
    // Every day strictly before today counts as passed.
    const passed = Array.from({ length: todayIndex }, (_, i) => i);
    const merged = [...new Set([...markedDays, ...passed])];
    persist(merged);
    toast.success(`Cut ${todayIndex} passed day${todayIndex === 1 ? "" : "s"}`);
  };

  const clearAll = async () => {
    const ok = await confirm({
      title: "Clear all marks?",
      message: `This un-cuts every day for ${year}.`,
      confirmText: "Clear",
      tone: "danger",
    });
    if (!ok) return;
    persist([]);
  };

  const cutCount = markedDays.length;
  const remaining = totalDays - cutCount;
  const pct = Math.round((cutCount / totalDays) * 100);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            365 Days · {year}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cut off each day as it passes and watch the year shrink. ✂️
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cutPassedDays}
            className="btn-primary"
            title="Cut every day up to today"
          >
            <FiScissors /> Cut passed days
          </button>
          <button
            onClick={clearAll}
            className="btn-ghost border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            title="Clear all marks"
          >
            <FiRotateCcw />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Cut" value={cutCount} accent="text-brand-600" />
        <StatCard label="Remaining" value={remaining} accent="text-slate-900 dark:text-white" />
        <StatCard label="Progress" value={`${pct}%`} accent="text-emerald-600" />
      </div>
      <div className="mb-8 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {status === "loading" && markedDays.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MONTHS.map((name, m) => (
            <MonthCard
              key={m}
              name={name}
              year={year}
              month={m}
              markedSet={markedSet}
              todayIndex={todayIndex}
              onToggle={toggleDay}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MonthCard = ({ name, year, month, markedSet, todayIndex, onToggle }) => {
  const numDays = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sun

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null); // leading padding
  for (let d = 1; d <= numDays; d++) cells.push(d);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">
        {name}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`p${i}`} />;
          const index = dayOfYearIndex(year, month, day);
          const isCut = markedSet.has(index);
          const isToday = index === todayIndex;
          return (
            <button
              key={day}
              onClick={() => onToggle(index)}
              title={`${name} ${day}`}
              className={`grid aspect-square place-items-center rounded-md text-[11px] font-semibold transition ${
                isCut
                  ? "bg-brand-600 text-white line-through opacity-90"
                  : "bg-slate-50 text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-700"
              } ${isToday && !isCut ? "ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-slate-800" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className={`mt-1 text-3xl font-extrabold ${accent}`}>{value}</p>
  </div>
);

export default YearTracker;

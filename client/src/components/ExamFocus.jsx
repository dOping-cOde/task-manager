import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCalendar, FiTarget, FiTrendingDown, FiPlus, FiAward } from "react-icons/fi";

import { fetchMockTests } from "../features/mockTests/mockTestsSlice";
import { addTask } from "../features/tasks/tasksSlice";
import { getCategory } from "../lib/constants";
import { dateKey, todayKey } from "../lib/dates";

// The catch-all bucket isn't a real revision subject, so we don't nudge on it.
const NUDGE_EXCLUDE = new Set(["General", ""]);

// Average score % per subject across every mock (full mocks use their section
// breakdown; sectional mocks use their single subject). Lowest average wins.
const computeWeakest = (mocks) => {
  const buckets = {}; // subject -> { sum, count }
  const add = (subject, pct) => {
    if (NUDGE_EXCLUDE.has(subject) || !Number.isFinite(pct)) return;
    if (!buckets[subject]) buckets[subject] = { sum: 0, count: 0 };
    buckets[subject].sum += pct;
    buckets[subject].count += 1;
  };

  mocks.forEach((m) => {
    if (Array.isArray(m.sections) && m.sections.length) {
      m.sections.forEach((s) => {
        if (s.max > 0) add(s.subject, (s.score / s.max) * 100);
      });
    } else if (m.subject && m.maxScore > 0) {
      add(m.subject, (m.score / m.maxScore) * 100);
    }
  });

  let weakest = null;
  Object.entries(buckets).forEach(([subject, { sum, count }]) => {
    const avg = sum / count;
    if (!weakest || avg < weakest.avg) weakest = { subject, avg, count };
  });
  return weakest;
};

const ExamFocus = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user);
  const profile = useSelector((s) => s.user.profile);
  const mocks = useSelector((s) => s.mockTests.items);
  const [adding, setAdding] = useState(false);

  // Prefer the freshest profile copy, fall back to the persisted auth user.
  const src = profile || authUser;
  const examDate = src?.examDate || null;
  const targetExam = src?.targetExam || "your exam";

  useEffect(() => {
    if (!mocks.length) dispatch(fetchMockTests());
  }, [dispatch, mocks.length]);

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    const today = todayKey();
    const target = dateKey(examDate);
    // Whole-day difference in local time.
    return Math.round(
      (new Date(target).getTime() - new Date(today).getTime()) / 86400000
    );
  }, [examDate]);

  const weakest = useMemo(() => computeWeakest(mocks), [mocks]);

  const addRevisionTask = async () => {
    if (!weakest) return;
    setAdding(true);
    const result = await dispatch(
      addTask({
        title: `Revise ${weakest.subject}`,
        category: weakest.subject,
        priority: "high",
        dueDate: new Date().toISOString(),
      })
    );
    setAdding(false);
    if (addTask.fulfilled.match(result)) {
      toast.success(`Revision task added for ${weakest.subject}`, { icon: "📚" });
    } else {
      toast.error(result.payload || "Could not add task");
    }
  };

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <CountdownCard
        examDate={examDate}
        daysLeft={daysLeft}
        targetExam={targetExam}
      />
      <WeakAreaCard
        weakest={weakest}
        hasMocks={mocks.length > 0}
        adding={adding}
        onAdd={addRevisionTask}
      />
    </div>
  );
};

const CountdownCard = ({ examDate, daysLeft, targetExam }) => {
  if (!examDate) {
    return (
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <IconBadge className="bg-brand-50 text-brand-600 dark:bg-slate-700">
            <FiCalendar />
          </IconBadge>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              Set your exam date
            </p>
            <Link
              to="/profile"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Add it in your profile →
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const passed = daysLeft < 0;
  const isToday = daysLeft === 0;
  const dateLabel = new Date(examDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="border-transparent bg-gradient-to-br from-brand-600 to-violet-600 text-white">
      <div className="flex items-center gap-3">
        <IconBadge className="bg-white/15 text-white">
          <FiTarget />
        </IconBadge>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
            {targetExam}
          </p>
          {isToday ? (
            <p className="text-xl font-extrabold">It's exam day — go crush it! 🎯</p>
          ) : passed ? (
            <p className="text-lg font-bold">Exam day has passed ({dateLabel})</p>
          ) : (
            <p className="text-2xl font-extrabold leading-tight">
              {daysLeft} day{daysLeft === 1 ? "" : "s"} to go
              <span className="ml-2 text-sm font-medium text-brand-100">
                · {dateLabel}
              </span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

const WeakAreaCard = ({ weakest, hasMocks, adding, onAdd }) => {
  if (!weakest) {
    return (
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <IconBadge className="bg-emerald-50 text-emerald-600 dark:bg-slate-700">
            <FiAward />
          </IconBadge>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {hasMocks ? "No weak area yet — nice!" : "Log a mock test"}
            </p>
            <Link
              to="/mock-tests"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {hasMocks ? "View mock tests →" : "Add your first mock →"}
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const cat = getCategory(weakest.subject);
  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBadge className="bg-rose-50 text-rose-600 dark:bg-slate-700">
            <FiTrendingDown />
          </IconBadge>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Weakest area
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {cat.emoji} {weakest.subject}
              <span className="ml-2 text-sm font-semibold text-rose-500">
                {Math.round(weakest.avg)}% avg
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={onAdd}
          disabled={adding}
          className="btn-primary shrink-0 px-3 py-2 text-xs"
          title={`Add a high-priority task to revise ${weakest.subject}`}
        >
          {adding ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <>
              <FiPlus /> Revise
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl border p-4 shadow-sm ${className}`}>{children}</div>
);

const IconBadge = ({ className = "", children }) => (
  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${className}`}>
    {children}
  </div>
);

export default ExamFocus;

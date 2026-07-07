import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiAward,
  FiTrendingUp,
  FiExternalLink,
  FiEye,
  FiClock,
  FiCalendar,
  FiTarget,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import {
  fetchMockTests,
  addMockTest,
  updateMockTest,
  deleteMockTest,
} from "../features/mockTests/mockTestsSlice";
import { getCategory } from "../lib/constants";
import useInfiniteScroll from "../lib/useInfiniteScroll";
import { useConfirm } from "../components/ConfirmProvider";

const CORE = ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"];

// Canonical exam config (SSC CGL style):
//   full-length → 200 marks, 60 minutes, 4 sections of 50 each
//   sectional   →  50 marks, 15 minutes (single section)
const FULL = { maxScore: 200, durationMin: 60 };
const SECTIONAL = { maxScore: 50, durationMin: 15 };
const SECTION_MAX = 50;

const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const fmtDateFull = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// A strong, readable colour for the mock name — brand for full-length mocks,
// the subject's own accent for sectional ones.
const SUBJECT_TEXT = {
  "Quantitative Aptitude": "text-sky-600 dark:text-sky-300",
  Reasoning: "text-violet-600 dark:text-violet-300",
  English: "text-rose-600 dark:text-rose-300",
  "General Awareness": "text-amber-600 dark:text-amber-300",
  General: "text-slate-600 dark:text-slate-300",
};
const nameColor = (t) =>
  t.type === "sectional" && SUBJECT_TEXT[t.subject]
    ? SUBJECT_TEXT[t.subject]
    : "text-brand-600 dark:text-brand-300";

// Performance-based colour for scores (green ≥75%, amber ≥50%, red below).
const scoreTone = (percent) => {
  if (percent >= 75)
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      bar: "bg-emerald-500",
    };
  if (percent >= 50)
    return {
      text: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      bar: "bg-amber-500",
    };
  return {
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    bar: "bg-rose-500",
  };
};

const MockTests = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { items, status } = useSelector((s) => s.mockTests);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filter, setFilter] = useState("all"); // all | full | <subject>

  useEffect(() => {
    dispatch(fetchMockTests());
  }, [dispatch]);

  const stats = useMemo(() => {
    if (!items.length) return { count: 0, avg: 0, best: 0, last: 0 };
    const percents = items.map((t) => pct(t.score, t.maxScore));
    return {
      count: items.length,
      avg: Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
      best: Math.max(...percents),
      last: percents[percents.length - 1],
    };
  }, [items]);

  const trendData = useMemo(
    () =>
      items.map((t) => ({ name: fmtDate(t.date), percent: pct(t.score, t.maxScore) })),
    [items]
  );

  const subjectData = useMemo(() => {
    const agg = {};
    const add = (subject, score, max) => {
      if (!max) return;
      agg[subject] ||= { total: 0, n: 0 };
      agg[subject].total += (score / max) * 100;
      agg[subject].n += 1;
    };
    items.forEach((t) => {
      if (t.type === "sectional" && t.subject) {
        // A sectional mock contributes directly to its subject.
        add(t.subject, t.score, t.maxScore);
      } else {
        (t.sections || []).forEach((s) => add(s.subject, s.score, s.max));
      }
    });
    return Object.entries(agg).map(([subject, { total, n }]) => ({
      subject: getCategory(subject).short,
      percent: Math.round(total / n),
    }));
  }, [items]);

  // Counts per filter tab.
  const counts = useMemo(() => {
    const c = { all: items.length, full: 0 };
    CORE.forEach((s) => (c[s] = 0));
    items.forEach((t) => {
      if (t.type === "full") c.full += 1;
      else if (t.type === "sectional" && t.subject) c[t.subject] = (c[t.subject] || 0) + 1;
    });
    return c;
  }, [items]);

  // Newest-first, then filtered by the active tab.
  const ordered = useMemo(() => [...items].reverse(), [items]);
  const filtered = useMemo(() => {
    return ordered.filter((t) => {
      if (filter === "all") return true;
      if (filter === "full") return t.type === "full";
      return t.type === "sectional" && t.subject === filter;
    });
  }, [ordered, filter]);

  const { visible, hasMore, sentinelRef } = useInfiniteScroll(filtered, {
    pageSize: 20,
    resetKey: filter,
  });

  const openEdit = (t) => {
    setEditing(t);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mock Tests
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track every mock and watch your scores climb. 📈
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <FiPlus /> Log test
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Tests taken" value={stats.count} />
        <Kpi label="Average" value={`${stats.avg}%`} tone="text-brand-600" />
        <Kpi label="Best" value={`${stats.best}%`} tone="text-emerald-600" icon={FiAward} />
        <Kpi label="Latest" value={`${stats.last}%`} tone="text-violet-600" icon={FiTrendingUp} />
      </div>

      {/* Charts */}
      {items.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Score trend">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Average by subject">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="percent" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Avg %" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Filter tabs — All / Full mock / subject-wise sectional */}
      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>
            All
          </FilterTab>
          <FilterTab active={filter === "full"} onClick={() => setFilter("full")} count={counts.full}>
            🎯 Full mock
          </FilterTab>
          {CORE.map((s) => (
            <FilterTab
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              count={counts[s]}
            >
              {getCategory(s).emoji} {getCategory(s).short}
            </FilterTab>
          ))}
        </div>
      )}

      {/* List */}
      {status === "loading" && !items.length ? (
        <div className="card h-40 animate-pulse" />
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-slate-700">
            <FiAward className="text-3xl" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">
            No mock tests yet
          </h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Log your first mock to start tracking your performance.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No mocks in this filter yet.
          </p>
          <button
            onClick={() => setFilter("all")}
            className="mt-2 text-sm font-semibold text-brand-600 hover:underline"
          >
            Show all mocks
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-700">
          {visible.map((t) => {
            const p = pct(t.score, t.maxScore);
            const tone = scoreTone(p);
            return (
              <div key={t._id} className="flex items-center gap-4 p-4">
                {/* Score % badge — coloured by performance */}
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${tone.badge}`}
                >
                  {p}%
                </div>
                <button
                  onClick={() => setViewing(t)}
                  className="min-w-0 flex-1 text-left"
                  title="View details"
                >
                  <div className="flex items-center gap-2">
                    <h4 className={`truncate font-bold ${nameColor(t)}`}>{t.name}</h4>
                    {t.type === "sectional" ? (
                      <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-900 dark:bg-violet-900/30 dark:text-violet-300">
                        Sectional{t.subject ? ` · ${getCategory(t.subject).short}` : ""}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-300">
                        Full
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.provider ? `${t.provider} · ` : ""}
                    {fmtDate(t.date)} ·{" "}
                    <span className={`font-bold ${tone.text}`}>
                      {t.score}/{t.maxScore}
                    </span>{" "}
                    · {t.durationMin}m
                  </p>
                </button>
                <button
                  onClick={() => setViewing(t)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700"
                  title="View details"
                >
                  <FiEye />
                </button>
                <button
                  onClick={() => openEdit(t)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700"
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete mock test?",
                      message: "This mock test result will be permanently deleted.",
                      confirmText: "Delete",
                      tone: "danger",
                    });
                    if (!ok) return;
                    const r = await dispatch(deleteMockTest(t._id));
                    if (deleteMockTest.fulfilled.match(r)) toast.success("Deleted");
                  }}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700"
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-5">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            </div>
          )}
        </div>
      )}

      {viewing && (
        <MockDetailModal
          test={viewing}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
        />
      )}

      {modalOpen && <MockModal test={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
};

const FilterTab = ({ active, onClick, count, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }`}
  >
    {children}
    <span
      className={`rounded-full px-1.5 text-[11px] font-bold ${
        active ? "bg-white/20" : "bg-black/5 dark:bg-white/10"
      }`}
    >
      {count || 0}
    </span>
  </button>
);

const Kpi = ({ label, value, tone = "text-slate-900 dark:text-white", icon: Icon }) => (
  <div className="card p-4">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
      {Icon && <Icon />} {label}
    </div>
    <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="card p-5">
    <h3 className="mb-3 font-bold text-slate-800 dark:text-white">{title}</h3>
    {children}
  </div>
);

// --- View / analysis modal ---
const MockDetailModal = ({ test, onClose, onEdit }) => {
  const percent = pct(test.score, test.maxScore);
  const tone = scoreTone(percent);
  const isSectional = test.type === "sectional";
  const sections = test.sections || [];
  const totals = sections.reduce(
    (a, s) => ({
      correct: a.correct + (s.correct || 0),
      wrong: a.wrong + (s.wrong || 0),
    }),
    { correct: 0, wrong: 0 }
  );
  const attempted = totals.correct + totals.wrong;
  const accuracy = attempted ? Math.round((totals.correct / attempted) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        {/* Gradient score hero */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
          >
            <FiX />
          </button>
          <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
            {isSectional
              ? `Sectional · ${getCategory(test.subject).short}`
              : "Full-length mock"}
          </span>
          <h2 className="mt-2 pr-10 text-2xl font-extrabold leading-tight">{test.name}</h2>
          <div className="mt-4 flex items-end gap-4">
            <p className="text-5xl font-extrabold leading-none">
              {percent}
              <span className="text-2xl">%</span>
            </p>
            <div className="pb-1">
              <p className="text-lg font-bold">
                {test.score} <span className="text-white/70">/ {test.maxScore}</span>
              </p>
              <p className="text-xs text-white/80">marks scored</p>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          <div className="flex flex-wrap gap-2">
            <Meta icon={FiCalendar} label={fmtDateFull(test.date)} />
            <Meta icon={FiClock} label={`${test.durationMin} min`} />
            {test.provider && <Meta icon={FiAward} label={test.provider} />}
            {accuracy !== null && <Meta icon={FiTarget} label={`${accuracy}% accuracy`} />}
          </div>

          {attempted > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Correct" value={totals.correct} tone="text-emerald-600 dark:text-emerald-400" />
              <MiniStat label="Wrong" value={totals.wrong} tone="text-rose-600 dark:text-rose-400" />
              <MiniStat label="Attempted" value={attempted} tone="text-slate-900 dark:text-white" />
            </div>
          )}

          {sections.length > 0 ? (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Section-wise score
              </h3>
              <div className="space-y-3">
                {sections.map((s) => {
                  const sp = pct(s.score, s.max);
                  const st = scoreTone(sp);
                  const cat = getCategory(s.subject);
                  return (
                    <div
                      key={s.subject}
                      className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                          <span>{cat.emoji}</span> {cat.short}
                        </span>
                        <span className={`text-sm font-extrabold ${st.text}`}>
                          {s.score}/{s.max} · {sp}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full ${st.bar}`}
                          style={{ width: `${sp}%` }}
                        />
                      </div>
                      {(s.correct || s.wrong) ? (
                        <div className="mt-2 flex gap-4 text-xs font-semibold">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <FiCheckCircle /> {s.correct} correct
                          </span>
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <FiXCircle /> {s.wrong} wrong
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !isSectional && (
              <p className="rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                No section-wise breakdown was recorded for this mock.
              </p>
            )
          )}

          {test.notes && (
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Notes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{test.notes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {test.link && (
              <a
                href={test.link}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost flex-1 border border-slate-200 dark:border-slate-700"
              >
                <FiExternalLink /> Visit mock
              </a>
            )}
            <button
              onClick={() => {
                onClose();
                onEdit(test);
              }}
              className="btn-primary flex-1"
            >
              <FiEdit2 /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Meta = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
    <Icon className="text-sm" /> {label}
  </span>
);

const MiniStat = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700">
    <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
  </div>
);

// --- Create / edit modal ---
const MockModal = ({ test, onClose }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(test);
  const [form, setForm] = useState({
    name: test?.name || "",
    provider: test?.provider || "",
    link: test?.link || "",
    type: test?.type || "full",
    subject: test?.subject || "Quantitative Aptitude",
    date: test?.date
      ? new Date(test.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    maxScore: test?.maxScore ?? FULL.maxScore,
    durationMin: test?.durationMin ?? FULL.durationMin,
    score: test?.score ?? 0,
  });

  const isSectional = form.type === "sectional";

  // Switch test type and snap the score/time to that type's canonical values.
  const setType = (type) =>
    setForm((p) => ({
      ...p,
      type,
      maxScore: type === "sectional" ? SECTIONAL.maxScore : FULL.maxScore,
      durationMin: type === "sectional" ? SECTIONAL.durationMin : FULL.durationMin,
    }));

  const [sections, setSections] = useState(() => {
    const base = {};
    // Each full-mock section is 50 marks by default (4 × 50 = 200).
    CORE.forEach((s) => (base[s] = { score: "", max: SECTION_MAX, correct: "", wrong: "" }));
    (test?.sections || []).forEach((s) => {
      base[s.subject] = {
        score: s.score ?? "",
        max: s.max ?? SECTION_MAX,
        correct: s.correct ?? "",
        wrong: s.wrong ?? "",
      };
    });
    return base;
  });
  const [saving, setSaving] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");

    // Enforce the per-type caps: sectional ≤ 50 marks & ≤ 15 min.
    let maxScore = Number(form.maxScore) || (isSectional ? SECTIONAL.maxScore : FULL.maxScore);
    let durationMin =
      Number(form.durationMin) || (isSectional ? SECTIONAL.durationMin : FULL.durationMin);
    if (isSectional) {
      maxScore = Math.min(maxScore, SECTIONAL.maxScore);
      durationMin = Math.min(durationMin, SECTIONAL.durationMin);
    }
    const score = Math.min(Math.max(Number(form.score) || 0, 0), maxScore);

    const payload = {
      ...form,
      subject: isSectional ? form.subject : "",
      maxScore,
      durationMin,
      score,
      date: new Date(form.date).toISOString(),
      // Per-section breakdown only applies to full-length mocks; keep the
      // sections the user actually scored (a blank score means "not recorded").
      sections: isSectional
        ? []
        : CORE.filter((s) => sections[s].score !== "" && sections[s].score !== null).map((s) => ({
            subject: s,
            score: Math.min(Number(sections[s].score) || 0, Number(sections[s].max) || SECTION_MAX),
            max: Number(sections[s].max) || SECTION_MAX,
            correct: Number(sections[s].correct) || 0,
            wrong: Number(sections[s].wrong) || 0,
          })),
    };

    setSaving(true);
    const r = await dispatch(
      isEdit ? updateMockTest({ id: test._id, updates: payload }) : addMockTest(payload)
    );
    setSaving(false);
    if (
      (isEdit && updateMockTest.fulfilled.match(r)) ||
      (!isEdit && addMockTest.fulfilled.match(r))
    ) {
      toast.success(isEdit ? "Updated" : "Mock test logged");
      onClose();
    } else {
      toast.error(r.payload || "Could not save");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? "Edit mock test" : "Log mock test"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Full-length vs sectional */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/40">
            {[
              { value: "full", label: "Full-length" },
              { value: "sectional", label: "Sectional" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  form.type === opt.value
                    ? "bg-brand-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isSectional && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Section
              </label>
              <select
                name="subject"
                value={form.subject}
                onChange={handle}
                className="input-field"
              >
                {CORE.map((s) => (
                  <option key={s} value={s}>
                    {getCategory(s).emoji} {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            name="name"
            value={form.name}
            onChange={handle}
            placeholder={
              isSectional
                ? "Test name (e.g. Quant Sectional #4)"
                : "Test name (e.g. SSC CGL Mock #12)"
            }
            className="input-field"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="provider"
              value={form.provider}
              onChange={handle}
              placeholder="Provider (optional)"
              className="input-field"
            />
            <input type="date" name="date" value={form.date} onChange={handle} className="input-field" />
          </div>
          <input
            name="link"
            type="url"
            value={form.link}
            onChange={handle}
            placeholder="Mock link (optional) — https://…"
            className="input-field"
          />
          <div className="grid grid-cols-3 gap-3">
            <LabeledNum
              label="Score"
              name="score"
              value={form.score}
              onChange={handle}
              min={0}
              max={form.maxScore}
            />
            <LabeledNum
              label="Max"
              name="maxScore"
              value={form.maxScore}
              onChange={handle}
              min={1}
              max={isSectional ? SECTIONAL.maxScore : undefined}
            />
            <LabeledNum
              label="Mins"
              name="durationMin"
              value={form.durationMin}
              onChange={handle}
              min={1}
              max={isSectional ? SECTIONAL.durationMin : undefined}
            />
          </div>
          <p className="text-xs text-slate-400">
            {isSectional
              ? "Sectional mock: up to 50 marks · 15 minutes."
              : "Full-length mock: 200 marks · 60 minutes · 4 sections of 50."}
          </p>

          {!isSectional && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Section-wise (optional)
              </p>
              <div className="space-y-2">
                {CORE.map((s) => (
                  <div key={s} className="grid grid-cols-5 items-center gap-2">
                    <span className="col-span-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {getCategory(s).short}
                    </span>
                    {["score", "max", "correct", "wrong"].map((f) => (
                      <input
                        key={f}
                        type="number"
                        placeholder={f}
                        value={sections[s][f]}
                        onChange={(e) =>
                          setSections((prev) => ({
                            ...prev,
                            [s]: { ...prev[s], [f]: e.target.value },
                          }))
                        }
                        className="input-field px-2 py-1.5 text-sm"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : isEdit ? "Save" : "Log test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LabeledNum = ({ label, ...props }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
    </label>
    <input type="number" className="input-field py-2" {...props} />
  </div>
);

export default MockTests;

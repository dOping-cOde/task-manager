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
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAward, FiTrendingUp, FiExternalLink } from "react-icons/fi";

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

const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

const MockTests = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { items, status } = useSelector((s) => s.mockTests);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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

  // Newest-first list, paged with infinite scroll so it scales to many tests.
  const ordered = useMemo(() => [...items].reverse(), [items]);
  const { visible, hasMore, sentinelRef } = useInfiniteScroll(ordered, {
    pageSize: 20,
  });

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
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-700">
          {visible.map((t) => (
            <div key={t._id} className="flex items-center gap-4 p-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-600 dark:bg-slate-700 dark:text-brand-300">
                {pct(t.score, t.maxScore)}%
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-semibold text-slate-800 dark:text-white">
                    {t.name}
                  </h4>
                  {t.type === "sectional" ? (
                    <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-900 dark:bg-violet-900/30 dark:text-violet-300">
                      Sectional{t.subject ? ` · ${getCategory(t.subject).short}` : ""}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      Full
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.provider ? `${t.provider} · ` : ""}
                  {fmtDate(t.date)} · {t.score}/{t.maxScore} · {t.durationMin}m
                </p>
                {t.link && (
                  <a
                    href={t.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <FiExternalLink /> Visit mock
                  </a>
                )}
              </div>
              <button
                onClick={() => {
                  setEditing(t);
                  setModalOpen(true);
                }}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700"
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
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-5">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <MockModal
          test={editing}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

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
    maxScore: test?.maxScore ?? 200,
    durationMin: test?.durationMin ?? 60,
    score: test?.score ?? 0,
  });

  // Switch test type, and nudge the default max score to a sensible value.
  const setType = (type) =>
    setForm((p) => ({
      ...p,
      type,
      maxScore:
        type === "sectional" && Number(p.maxScore) === 200
          ? 50
          : type === "full" && Number(p.maxScore) === 50
          ? 200
          : p.maxScore,
    }));
  const [sections, setSections] = useState(() => {
    const base = {};
    CORE.forEach((s) => (base[s] = { score: "", max: "", correct: "", wrong: "" }));
    (test?.sections || []).forEach((s) => {
      base[s.subject] = {
        score: s.score ?? "",
        max: s.max ?? "",
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

    const isSectional = form.type === "sectional";

    const payload = {
      ...form,
      subject: isSectional ? form.subject : "",
      maxScore: Number(form.maxScore),
      durationMin: Number(form.durationMin),
      score: Number(form.score),
      date: new Date(form.date).toISOString(),
      // Per-section breakdown only applies to full-length mocks.
      sections: isSectional
        ? []
        : CORE.filter((s) => sections[s].max !== "").map((s) => ({
            subject: s,
            score: Number(sections[s].score) || 0,
            max: Number(sections[s].max) || 0,
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

          {form.type === "sectional" && (
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
              form.type === "sectional"
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
            <LabeledNum label="Score" name="score" value={form.score} onChange={handle} />
            <LabeledNum label="Max" name="maxScore" value={form.maxScore} onChange={handle} />
            <LabeledNum label="Mins" name="durationMin" value={form.durationMin} onChange={handle} />
          </div>

          {form.type === "full" && (
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
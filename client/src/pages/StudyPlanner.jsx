import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiZap, FiCalendar, FiClock, FiSave, FiCpu } from "react-icons/fi";

import { generatePlan, savePlanTasks, clearPlan } from "../features/ai/aiSlice";
import { fetchTasks } from "../features/tasks/tasksSlice";
import { CATEGORIES, getCategory } from "../lib/constants";
import { dateKey, todayKey } from "../lib/dates";
import Markdown from "../components/Markdown";

const LEVELS = ["beginner", "intermediate", "advanced"];

const StudyPlanner = () => {
  const dispatch = useDispatch();
  const { plan, status, error, saving } = useSelector((s) => s.ai);

  const [form, setForm] = useState({
    examName: "SSC CGL",
    durationDays: 14,
    hoursPerDay: 4,
    level: "intermediate",
    weakAreas: "",
  });
  const [focus, setFocus] = useState([]);
  const [startDate, setStartDate] = useState(todayKey());

  const loading = status === "loading";

  const toggleFocus = (value) =>
    setFocus((f) => (f.includes(value) ? f.filter((x) => x !== value) : [...f, value]));

  const handleGenerate = (e) => {
    e.preventDefault();
    dispatch(
      generatePlan({
        examName: form.examName,
        durationDays: Number(form.durationDays),
        hoursPerDay: Number(form.hoursPerDay),
        level: form.level,
        focusSubjects: focus,
        weakAreas: form.weakAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      })
    );
  };

  // Map every plan task to a real Task with a due date offset from the start.
  const handleSave = async () => {
    if (!plan) return;
    const start = new Date(startDate + "T00:00:00");
    const tasks = [];
    plan.days.forEach((d) => {
      const due = new Date(start);
      due.setDate(start.getDate() + (d.day - 1));
      d.tasks.forEach((t) =>
        tasks.push({
          title: t.title,
          category: t.category,
          priority: t.priority,
          dueDate: dateKey(due) + "T00:00:00",
        })
      );
    });

    const result = await dispatch(savePlanTasks(tasks));
    if (savePlanTasks.fulfilled.match(result)) {
      toast.success(`Added ${result.payload.count} tasks to your schedule 🎉`);
      dispatch(fetchTasks());
    } else {
      toast.error(result.payload || "Could not save tasks");
    }
  };

  const totalTasks = plan?.days?.reduce((n, d) => n + d.tasks.length, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          <FiCpu className="text-brand-600" /> AI Study Planner
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Generate a personalised, day-by-day plan — then add it to your schedule in one click.
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          ℹ️ Free AI is limited to 2 requests/day per user — the developer is a student running this
          on a free AI model, so usage is capped to keep it free for everyone.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <form
          onSubmit={handleGenerate}
          className="card space-y-4 p-5 lg:col-span-1 lg:sticky lg:top-20 lg:self-start"
        >
          <Field label="Exam">
            <input
              className="input-field"
              value={form.examName}
              onChange={(e) => setForm((p) => ({ ...p, examName: e.target.value }))}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Days">
              <input
                type="number"
                min={1}
                max={90}
                className="input-field"
                value={form.durationDays}
                onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
              />
            </Field>
            <Field label="Hours / day">
              <input
                type="number"
                min={1}
                max={16}
                className="input-field"
                value={form.hoursPerDay}
                onChange={(e) => setForm((p) => ({ ...p, hoursPerDay: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Current level">
            <select
              className="input-field"
              value={form.level}
              onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l[0].toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Emphasise subjects">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.value !== "General").map((c) => {
                const active = focus.includes(c.value);
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => toggleFocus(c.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    {c.emoji} {c.short}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Weak areas (comma separated)">
            <input
              className="input-field"
              placeholder="e.g. Time & Work, Idioms"
              value={form.weakAreas}
              onChange={(e) => setForm((p) => ({ ...p, weakAreas: e.target.value }))}
            />
          </Field>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating…
              </>
            ) : (
              <>
                <FiZap /> Generate plan
              </>
            )}
          </button>
        </form>

        {/* Result */}
        <div className="lg:col-span-2">
          {error && (
            <div className="card border-red-200 p-4 text-sm text-red-600 dark:border-red-900">
              {error}
            </div>
          )}

          {!plan && !loading && !error && (
            <div className="card grid place-items-center p-12 text-center text-slate-400">
              <FiCpu className="mb-3 text-4xl" />
              <p className="font-medium">Your generated plan will appear here.</p>
              <p className="text-sm">Fill in the form and hit Generate.</p>
            </div>
          )}

          {loading && (
            <div className="card grid place-items-center p-12 text-center text-slate-400">
              <span className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
              Building your personalised plan…
            </div>
          )}

          {plan && (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {plan.examName} · {plan.days.length}-day plan
                    </h2>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      <Markdown>{plan.summary}</Markdown>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {totalTasks} tasks across {plan.days.length} days
                    </p>
                  </div>
                  <button onClick={() => dispatch(clearPlan())} className="btn-ghost text-slate-400">
                    Clear
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <Field label="Start date">
                    <input
                      type="date"
                      className="input-field"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                  <button onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <>
                        <FiSave /> Add all to schedule
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {plan.days.map((d) => (
                  <div key={d.day} className="card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                        {d.day}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <FiCalendar className="text-slate-400" /> {d.focus}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {d.tasks.map((t, i) => {
                        const cat = getCategory(t.category);
                        return (
                          <li
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-700"
                          >
                            <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${cat.color}`}>
                              {cat.short}
                            </span>
                            <span className="flex-1 text-slate-700 dark:text-slate-200">{t.title}</span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <FiClock /> {t.estimatedMinutes}m
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    {children}
  </div>
);

export default StudyPlanner;

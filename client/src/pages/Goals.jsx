import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTarget, FiCheck } from "react-icons/fi";

import { fetchGoals, addGoal, updateGoal, deleteGoal } from "../features/goals/goalsSlice";
import { dueLabel } from "../lib/dates";
import { useConfirm } from "../components/ConfirmProvider";

const TYPES = [
  { value: "tasks", label: "Tasks" },
  { value: "study_hours", label: "Study hours" },
  { value: "mock_tests", label: "Mock tests" },
  { value: "custom", label: "Custom" },
];
const PERIODS = ["daily", "weekly", "monthly"];

const Goals = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { items, status } = useSelector((s) => s.goals);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    dispatch(fetchGoals());
  }, [dispatch]);

  const bump = (g) => {
    const progress = Math.min(g.progress + 1, g.target);
    dispatch(updateGoal({ id: g._id, updates: { progress } }));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goals</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set targets and crush them. Consistency wins the exam. 🎯
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <FiPlus /> New goal
        </button>
      </div>

      {status === "loading" && !items.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-slate-700">
            <FiTarget className="text-3xl" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">
            No goals yet
          </h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Define a target — e.g. "Solve 500 Quant questions this week".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => {
            const pct = Math.min(Math.round((g.progress / g.target) * 100), 100);
            const due = g.deadline ? dueLabel(g.deadline) : null;
            return (
              <div key={g._id} className="card flex flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-white">{g.title}</h3>
                  {g.completed && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Done
                    </span>
                  )}
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 capitalize">
                    {g.period}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300 capitalize">
                    {g.type.replace("_", " ")}
                  </span>
                  {due && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {due.text}
                    </span>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {g.progress}/{g.target} {g.unit}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        g.completed ? "bg-emerald-500" : "bg-brand-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => bump(g)}
                      disabled={g.completed}
                      className="btn-primary flex-1 py-2 text-xs disabled:opacity-50"
                    >
                      <FiCheck /> +1
                    </button>
                    <button
                      onClick={() => {
                        setEditing(g);
                        setModalOpen(true);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Delete goal?",
                          message: "This goal will be permanently deleted.",
                          confirmText: "Delete",
                          tone: "danger",
                        });
                        if (!ok) return;
                        const r = await dispatch(deleteGoal(g._id));
                        if (deleteGoal.fulfilled.match(r)) toast.success("Deleted");
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && <GoalModal goal={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
};

const GoalModal = ({ goal, onClose }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(goal);
  const [form, setForm] = useState({
    title: goal?.title || "",
    type: goal?.type || "custom",
    period: goal?.period || "weekly",
    target: goal?.target ?? 1,
    unit: goal?.unit || "",
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    const payload = {
      ...form,
      target: Number(form.target) || 1,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };
    setSaving(true);
    const r = await dispatch(
      isEdit ? updateGoal({ id: goal._id, updates: payload }) : addGoal(payload)
    );
    setSaving(false);
    if ((isEdit && updateGoal.fulfilled.match(r)) || (!isEdit && addGoal.fulfilled.match(r))) {
      toast.success(isEdit ? "Goal updated" : "Goal created");
      onClose();
    } else toast.error(r.payload || "Could not save");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? "Edit goal" : "New goal"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <FiX />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handle}
            autoFocus
            placeholder="e.g. Solve 500 Quant questions"
            className="input-field"
          />
          <div className="grid grid-cols-2 gap-3">
            <select name="type" value={form.type} onChange={handle} className="input-field">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select name="period" value={form.period} onChange={handle} className="input-field capitalize">
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Target
              </label>
              <input type="number" name="target" value={form.target} onChange={handle} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Unit (optional)
              </label>
              <input name="unit" value={form.unit} onChange={handle} placeholder="questions, hours…" className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Deadline (optional)
            </label>
            <input type="date" name="deadline" value={form.deadline} onChange={handle} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : isEdit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Goals;
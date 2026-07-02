import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiX,
  FiZap,
  FiTrash2,
  FiRotateCcw,
  FiCheck,
  FiCheckCircle,
} from "react-icons/fi";

import {
  fetchChallenges,
  addChallenge,
  updateChallenge,
  deleteChallenge,
} from "../features/challenges/challengesSlice";
import { useConfirm } from "../components/ConfirmProvider";

const CHALLENGE_LENGTH = 21;
const DAYS = Array.from({ length: CHALLENGE_LENGTH }, (_, i) => i);

const Challenges = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { items, status } = useSelector((s) => s.challenges);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchChallenges());
  }, [dispatch]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            21-Day Challenge
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Build a habit in 21 days. Tick off each day you show up. 🔥
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <FiPlus className="text-lg" /> New challenge
        </button>
      </div>

      {status === "loading" && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <ChallengeCard
              key={c._id}
              challenge={c}
              dispatch={dispatch}
              confirm={confirm}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ChallengeModal
          onClose={() => setModalOpen(false)}
          dispatch={dispatch}
        />
      )}
    </div>
  );
};

const ChallengeCard = ({ challenge, dispatch, confirm }) => {
  const done = challenge.completedDays.length;
  const pct = Math.round((done / CHALLENGE_LENGTH) * 100);
  const doneSet = new Set(challenge.completedDays);

  const toggleDay = (index) => {
    const wasComplete = done >= CHALLENGE_LENGTH;
    const next = doneSet.has(index)
      ? challenge.completedDays.filter((d) => d !== index)
      : [...challenge.completedDays, index];
    dispatch(updateChallenge({ id: challenge._id, updates: { completedDays: next } }));
    if (!wasComplete && next.length >= CHALLENGE_LENGTH) {
      toast.success(`Challenge complete: ${challenge.title}! 🎉`, { icon: "🏆" });
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: "Reset & restart?",
      message: `This clears all ${done} ticked day${
        done === 1 ? "" : "s"
      } and starts the 21 days over. It counts as attempt #${
        challenge.attempts + 1
      }.`,
      confirmText: "Reset & restart",
      tone: "danger",
    });
    if (!ok) return;
    dispatch(updateChallenge({ id: challenge._id, updates: { resetAttempt: true } }));
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete challenge?",
      message: `"${challenge.title}" will be permanently deleted.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const r = await dispatch(deleteChallenge(challenge._id));
    if (deleteChallenge.fulfilled.match(r)) toast.success("Deleted");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">
              {challenge.title}
            </h3>
            {challenge.completed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <FiCheckCircle /> Done
              </span>
            )}
          </div>
          {challenge.description && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {challenge.description}
            </p>
          )}
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {challenge.completed
              ? `Completed in ${challenge.attempts} attempt${
                  challenge.attempts === 1 ? "" : "s"
                } 🎯`
              : `Attempt #${challenge.attempts}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={handleReset}
            title="Reset"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <FiRotateCcw />
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            {done} / {CHALLENGE_LENGTH} days
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 21-day grid */}
      <div className="mt-4 grid grid-cols-7 gap-2">
        {DAYS.map((i) => {
          const isDone = doneSet.has(i);
          return (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              title={`Day ${i + 1}`}
              className={`grid aspect-square place-items-center rounded-lg border text-xs font-bold transition ${
                isDone
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-400 hover:border-brand-300 hover:text-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
              }`}
            >
              {isDone ? <FiCheck /> : i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ChallengeModal = ({ onClose, dispatch }) => {
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Give your challenge a name");
      return;
    }
    setSaving(true);
    const r = await dispatch(addChallenge(form));
    setSaving(false);
    if (addChallenge.fulfilled.match(r)) {
      toast.success("Challenge started! 💪");
      onClose();
    } else {
      toast.error(r.payload || "Could not create challenge");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            New 21-day challenge
          </h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Challenge
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
              placeholder="e.g. Study 2 hours every day"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Why this matters, your rules…"
              className="input-field resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                "Start challenge"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmptyState = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800">
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-slate-700">
      <FiZap className="text-3xl" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">
      No challenges yet
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
      Start a 21-day challenge and build the habit that cracks the exam.
    </p>
    <button onClick={onCreate} className="btn-primary mt-5">
      <FiPlus /> Start your first challenge
    </button>
  </div>
);

export default Challenges;

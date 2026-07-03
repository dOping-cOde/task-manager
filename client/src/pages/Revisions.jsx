import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiX,
  FiSearch,
  FiRepeat,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiMinus,
  FiRotateCw,
  FiInbox,
} from "react-icons/fi";

import {
  fetchRevisions,
  addRevision,
  updateRevision,
  deleteRevision,
} from "../features/revisions/revisionsSlice";
import { CATEGORIES, PRIORITIES, getCategory } from "../lib/constants";
import { dateKey, todayKey } from "../lib/dates";
import { useConfirm } from "../components/ConfirmProvider";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "due", label: "Due" },
  { value: "todo", label: "To revise" },
  { value: "done", label: "Mastered" },
];

const DUE_TONES = {
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  today: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  future: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  new: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const PRIORITY_BADGE = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

// Human label for a revision's next-due date.
const dueInfo = (rev) => {
  if (rev.done) return { text: "Mastered", tone: "done" };
  if (!rev.nextRevisionAt) return { text: "Revise now", tone: "new" };
  const key = dateKey(rev.nextRevisionAt);
  const today = todayKey();
  if (key < today) return { text: "Overdue", tone: "overdue" };
  if (key === today) return { text: "Due today", tone: "today" };
  const days = Math.round(
    (new Date(key).getTime() - new Date(today).getTime()) / 86400000
  );
  return { text: `Due in ${days}d`, tone: "future" };
};

const isDue = (rev) =>
  !rev.done && (!rev.nextRevisionAt || dateKey(rev.nextRevisionAt) <= todayKey());

// Sort: unfinished & most-due first; mastered chapters sink to the bottom.
const sortKey = (r) => {
  if (r.done) return Infinity;
  if (!r.nextRevisionAt) return 0;
  return new Date(dateKey(r.nextRevisionAt)).getTime();
};

const Revisions = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { items, status } = useSelector((s) => s.revisions);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [subject, setSubject] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchRevisions());
  }, [dispatch]);

  const stats = useMemo(() => {
    return {
      chapters: items.length,
      revisions: items.reduce((sum, r) => sum + (r.revisionCount || 0), 0),
      due: items.filter(isDue).length,
      mastered: items.filter((r) => r.done).length,
    };
  }, [items]);

  // Per-subject counts for the filter chips.
  const subjectCounts = useMemo(() => {
    const map = {};
    items.forEach((r) => {
      map[r.subject] = (map[r.subject] || 0) + 1;
    });
    return map;
  }, [items]);

  const visible = useMemo(() => {
    return items
      .filter((r) => (subject === "all" ? true : r.subject === subject))
      .filter((r) => {
        if (statusFilter === "due") return isDue(r);
        if (statusFilter === "todo") return !r.done;
        if (statusFilter === "done") return r.done;
        return true;
      })
      .filter((r) =>
        r.chapter.toLowerCase().includes(search.trim().toLowerCase())
      )
      .slice()
      .sort((a, b) => sortKey(a) - sortKey(b));
  }, [items, subject, statusFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (rev) => {
    setEditing(rev);
    setModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Revision
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Revise your important chapters on a schedule so they stick. 🔁
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary whitespace-nowrap">
          <FiPlus className="text-lg" /> Add chapter
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Chapters" value={stats.chapters} accent="text-slate-900 dark:text-white" />
        <StatCard label="Revisions" value={stats.revisions} accent="text-brand-600" />
        <StatCard label="Due now" value={stats.due} accent="text-rose-600" />
        <StatCard label="Mastered" value={stats.mastered} accent="text-emerald-600" />
      </div>

      {/* Subject chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={subject === "all"} onClick={() => setSubject("all")}>
          All subjects
          <Count>{items.length}</Count>
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={subject === c.value}
            onClick={() => setSubject(c.value)}
          >
            {c.emoji} {c.short}
            <Count>{subjectCounts[c.value] || 0}</Count>
          </Chip>
        ))}
      </div>

      {/* Status filter + search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                statusFilter === f.value
                  ? "bg-brand-600 text-white shadow"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chapters…"
            className="input-field py-2.5 pl-10"
          />
        </div>
      </div>

      {/* List */}
      {status === "loading" && items.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState onCreate={openCreate} hasAny={items.length > 0} />
      ) : (
        <div className="space-y-3">
          {visible.map((rev) => (
            <RevisionCard
              key={rev._id}
              rev={rev}
              dispatch={dispatch}
              confirm={confirm}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <RevisionModal
          onClose={() => setModalOpen(false)}
          dispatch={dispatch}
          editing={editing}
        />
      )}
    </div>
  );
};

const RevisionCard = ({ rev, dispatch, confirm, onEdit }) => {
  const cat = getCategory(rev.subject);
  const due = dueInfo(rev);

  const logRevision = async () => {
    const r = await dispatch(
      updateRevision({ id: rev._id, updates: { logRevision: true } })
    );
    if (updateRevision.fulfilled.match(r)) {
      toast.success(`Revised · ${r.payload.revisionCount}×`, { icon: "🔁" });
    }
  };

  const changeCount = (delta) => {
    const next = Math.max(0, (rev.revisionCount || 0) + delta);
    dispatch(updateRevision({ id: rev._id, updates: { revisionCount: next } }));
  };

  const toggleDone = () => {
    dispatch(updateRevision({ id: rev._id, updates: { done: !rev.done } }));
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete chapter?",
      message: `"${rev.chapter}" will be removed from your revision list.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const r = await dispatch(deleteRevision(rev._id));
    if (deleteRevision.fulfilled.match(r)) toast.success("Deleted");
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition dark:bg-slate-800 ${
        rev.done
          ? "border-emerald-200 dark:border-emerald-900/50"
          : "border-slate-200 hover:border-brand-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Subject swatch */}
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${cat.color}`}>
          {cat.emoji}
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-base font-bold text-slate-900 dark:text-white ${
                rev.done ? "line-through opacity-60" : ""
              }`}
            >
              {rev.chapter}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                PRIORITY_BADGE[rev.priority] || PRIORITY_BADGE.medium
              }`}
            >
              {rev.priority}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                DUE_TONES[due.tone]
              }`}
            >
              {due.text}
            </span>
          </div>

          <p className="mt-0.5 text-xs font-medium text-slate-400">
            {cat.short}
            {rev.lastRevisedAt && (
              <>
                {" · last revised "}
                {new Date(rev.lastRevisedAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </>
            )}
          </p>

          {rev.note && (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {rev.note}
            </p>
          )}

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Revision counter */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => changeCount(-1)}
                className="grid h-8 w-8 place-items-center rounded-l-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                title="Decrease count"
              >
                <FiMinus className="text-xs" />
              </button>
              <span className="min-w-[3.5rem] px-2 text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                {rev.revisionCount}× <span className="font-normal text-slate-400">done</span>
              </span>
              <button
                onClick={() => changeCount(1)}
                className="grid h-8 w-8 place-items-center rounded-r-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                title="Increase count"
              >
                <FiPlus className="text-xs" />
              </button>
            </div>

            {/* Revise now (bumps count + reschedules) */}
            <button
              onClick={logRevision}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
              title="Log a revision and schedule the next one"
            >
              <FiRotateCw /> Revise
            </button>

            {/* Mark done */}
            <button
              onClick={toggleDone}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                rev.done
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
              }`}
            >
              <FiCheck /> {rev.done ? "Mastered" : "Mark done"}
            </button>
          </div>
        </div>

        {/* Edit / delete */}
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={() => onEdit(rev)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700"
            title="Edit"
          >
            <FiEdit2 />
          </button>
          <button
            onClick={handleDelete}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700"
            title="Delete"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
};

const RevisionModal = ({ onClose, dispatch, editing }) => {
  const isEdit = Boolean(editing);
  const [form, setForm] = useState({
    chapter: editing?.chapter || "",
    subject: editing?.subject || "General",
    priority: editing?.priority || "medium",
    note: editing?.note || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.chapter.trim()) {
      toast.error("Enter a chapter or topic");
      return;
    }
    setSaving(true);
    const action = isEdit
      ? updateRevision({ id: editing._id, updates: form })
      : addRevision(form);
    const r = await dispatch(action);
    setSaving(false);
    if (
      (isEdit && updateRevision.fulfilled.match(r)) ||
      (!isEdit && addRevision.fulfilled.match(r))
    ) {
      toast.success(isEdit ? "Chapter updated" : "Chapter added to revise");
      onClose();
    } else {
      toast.error(r.payload || "Could not save");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? "Edit chapter" : "Add chapter to revise"}
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
              Chapter / topic
            </label>
            <input
              value={form.chapter}
              onChange={(e) => setForm({ ...form, chapter: e.target.value })}
              autoFocus
              placeholder="e.g. Time, Speed & Distance"
              className="input-field"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Subject
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, subject: c.value })}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                    form.subject === c.value
                      ? c.color + " ring-2 ring-brand-300"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                  title={c.value}
                >
                  <span className="text-base">{c.emoji}</span>
                  {c.short}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Importance
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                    form.priority === p.value
                      ? p.color + " ring-2 ring-brand-300"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Formulas, tricky bits, source…"
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
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add chapter"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className={`mt-1 text-2xl font-extrabold sm:text-3xl ${accent}`}>{value}</p>
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }`}
  >
    {children}
  </button>
);

const Count = ({ children }) => (
  <span className="rounded-full bg-black/10 px-1.5 text-[11px] font-bold">
    {children}
  </span>
);

const EmptyState = ({ onCreate, hasAny }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800">
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-slate-700">
      <FiInbox className="text-3xl" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">
      {hasAny ? "Nothing here" : "No chapters to revise yet"}
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
      {hasAny
        ? "Try a different subject or filter."
        : "Add the important chapters you want to revise and track every pass."}
    </p>
    {!hasAny && (
      <button onClick={onCreate} className="btn-primary mt-5">
        <FiPlus /> Add your first chapter
      </button>
    )}
  </div>
);

export default Revisions;

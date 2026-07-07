import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiX,
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiInbox,
  FiBookOpen,
} from "react-icons/fi";

import {
  fetchSyllabus,
  addChapter,
  updateChapter,
  deleteChapter,
} from "../features/syllabus/syllabusSlice";
import { CATEGORIES, getCategory } from "../lib/constants";
import { useConfirm } from "../components/ConfirmProvider";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "done", label: "Completed" },
];

const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);

const Syllabus = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { items, status } = useSelector((s) => s.syllabus);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [subject, setSubject] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchSyllabus());
  }, [dispatch]);

  // Overall completion.
  const overall = useMemo(() => {
    const total = items.length;
    const done = items.filter((c) => c.completed).length;
    return { total, done, percent: pct(done, total) };
  }, [items]);

  // Per-subject completion — the subject-wise report. We show a card for every
  // subject that has at least one chapter, in CATEGORIES order.
  const bySubject = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const chapters = items.filter((c) => c.subject === cat.value);
      const done = chapters.filter((c) => c.completed).length;
      return {
        ...cat,
        total: chapters.length,
        done,
        percent: pct(done, chapters.length),
      };
    }).filter((s) => s.total > 0);
  }, [items]);

  const subjectCounts = useMemo(() => {
    const map = {};
    items.forEach((c) => {
      map[c.subject] = (map[c.subject] || 0) + 1;
    });
    return map;
  }, [items]);

  const visible = useMemo(() => {
    return items
      .filter((c) => (subject === "all" ? true : c.subject === subject))
      .filter((c) => {
        if (statusFilter === "todo") return !c.completed;
        if (statusFilter === "done") return c.completed;
        return true;
      })
      .filter((c) =>
        c.chapter.toLowerCase().includes(search.trim().toLowerCase())
      );
  }, [items, subject, statusFilter, search]);

  // Group the visible chapters by subject (CATEGORIES order) for the list.
  const groups = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      cat,
      chapters: visible.filter((c) => c.subject === cat.value),
    })).filter((g) => g.chapters.length > 0);
  }, [visible]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (chapter) => {
    setEditing(chapter);
    setModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Syllabus Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add every chapter of your subjects and tick them off as you finish. 📚
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary whitespace-nowrap">
          <FiPlus className="text-lg" /> Add chapter
        </button>
      </div>

      {/* Overall progress */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Overall syllabus completed
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {overall.done} of {overall.total} chapters done
            </p>
          </div>
          <p className="text-4xl font-extrabold text-brand-600 sm:text-5xl">
            {overall.percent}
            <span className="text-2xl">%</span>
          </p>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${overall.percent}%` }}
          />
        </div>
      </div>

      {/* Subject-wise report */}
      {bySubject.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bySubject.map((s) => (
            <div
              key={s.value}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${s.color}`}
                >
                  {s.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    {s.short}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {s.done}/{s.total} chapters
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {s.percent}
                  <span className="text-sm text-slate-400">%</span>
                </p>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${s.bar}`}
                  style={{ width: `${s.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* List (grouped by subject) */}
      {status === "loading" && items.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState onCreate={openCreate} hasAny={items.length > 0} />
      ) : (
        <div className="space-y-6">
          {groups.map(({ cat, chapters }) => {
            const done = chapters.filter((c) => c.completed).length;
            return (
              <div key={cat.value}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="text-base">{cat.emoji}</span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    {cat.short}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {done}/{chapters.length} · {pct(done, chapters.length)}%
                  </span>
                </div>
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <ChapterRow
                      key={chapter._id}
                      chapter={chapter}
                      dispatch={dispatch}
                      confirm={confirm}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ChapterModal
          onClose={() => setModalOpen(false)}
          dispatch={dispatch}
          editing={editing}
          defaultSubject={subject === "all" ? "General" : subject}
        />
      )}
    </div>
  );
};

const ChapterRow = ({ chapter, dispatch, confirm, onEdit }) => {
  const toggleDone = () => {
    dispatch(
      updateChapter({
        id: chapter._id,
        updates: { completed: !chapter.completed },
      })
    );
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete chapter?",
      message: `"${chapter.chapter}" will be removed from your syllabus.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const r = await dispatch(deleteChapter(chapter._id));
    if (deleteChapter.fulfilled.match(r)) toast.success("Deleted");
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition dark:bg-slate-800 ${
        chapter.completed
          ? "border-emerald-200 dark:border-emerald-900/50"
          : "border-slate-200 hover:border-brand-200 dark:border-slate-700"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={toggleDone}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition ${
          chapter.completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 text-transparent hover:border-brand-400 dark:border-slate-600"
        }`}
        title={chapter.completed ? "Mark as not done" : "Mark as done"}
      >
        <FiCheck className="text-sm" />
      </button>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold text-slate-900 dark:text-white ${
            chapter.completed ? "line-through opacity-60" : ""
          }`}
        >
          {chapter.chapter}
        </p>
        {chapter.note && (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {chapter.note}
          </p>
        )}
      </div>

      {/* Edit / delete */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onEdit(chapter)}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700"
          title="Edit"
        >
          <FiEdit2 />
        </button>
        <button
          onClick={handleDelete}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700"
          title="Delete"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

const ChapterModal = ({ onClose, dispatch, editing, defaultSubject }) => {
  const isEdit = Boolean(editing);
  const [form, setForm] = useState({
    chapter: editing?.chapter || "",
    subject: editing?.subject || defaultSubject || "General",
    note: editing?.note || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.chapter.trim()) {
      toast.error("Enter a chapter name");
      return;
    }
    setSaving(true);
    const action = isEdit
      ? updateChapter({ id: editing._id, updates: form })
      : addChapter(form);
    const r = await dispatch(action);
    setSaving(false);
    if (
      (isEdit && updateChapter.fulfilled.match(r)) ||
      (!isEdit && addChapter.fulfilled.match(r))
    ) {
      toast.success(isEdit ? "Chapter updated" : "Chapter added");
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
            {isEdit ? "Edit chapter" : "Add chapter"}
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
              Chapter name
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Source book, weak areas, etc."
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
      {hasAny ? "Nothing here" : "No chapters added yet"}
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
      {hasAny
        ? "Try a different subject or filter."
        : "Add the chapters of each subject to start tracking your syllabus."}
    </p>
    {!hasAny && (
      <button onClick={onCreate} className="btn-primary mt-5">
        <FiPlus /> Add your first chapter
      </button>
    )}
  </div>
);

export default Syllabus;

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiStar } from "react-icons/fi";

import { fetchNotes, addNote, updateNote, deleteNote } from "../features/notes/notesSlice";
import { CATEGORIES, getCategory } from "../lib/constants";

const COLORS = {
  default: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
  yellow: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50",
  green: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50",
  blue: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/50",
  pink: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800/50",
};
const COLOR_SWATCH = {
  default: "bg-slate-300",
  yellow: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  pink: "bg-pink-400",
};

const Notes = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.notes);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchNotes());
  }, [dispatch]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quick formulas, tricks, and revision points. 📝
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-56">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="input-field py-2.5 pl-10"
            />
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="btn-primary whitespace-nowrap"
          >
            <FiPlus /> New
          </button>
        </div>
      </div>

      {status === "loading" && !items.length ? (
        <div className="card h-40 animate-pulse" />
      ) : visible.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {items.length ? "No matching notes" : "No notes yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {items.length ? "Try a different search." : "Jot down your first revision note."}
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visible.map((n) => {
            const cat = getCategory(n.subject);
            return (
              <div
                key={n._id}
                className={`mb-4 break-inside-avoid rounded-2xl border p-4 shadow-sm ${COLORS[n.color] || COLORS.default}`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-white">{n.title}</h3>
                  <button
                    onClick={() => dispatch(updateNote({ id: n._id, updates: { pinned: !n.pinned } }))}
                    className={`shrink-0 ${n.pinned ? "text-amber-500" : "text-slate-300 dark:text-slate-500"}`}
                    title={n.pinned ? "Unpin" : "Pin"}
                  >
                    <FiStar className={n.pinned ? "fill-amber-500" : ""} />
                  </button>
                </div>
                {n.content && (
                  <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                    {n.content}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cat.color}`}>
                    {cat.emoji} {cat.short}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(n);
                        setModalOpen(true);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-black/5 hover:text-brand-600 dark:hover:bg-white/10"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Delete this note?")) return;
                        const r = await dispatch(deleteNote(n._id));
                        if (deleteNote.fulfilled.match(r)) toast.success("Deleted");
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-black/5 hover:text-red-600 dark:hover:bg-white/10"
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

      {modalOpen && <NoteModal note={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
};

const NoteModal = ({ note, onClose }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(note);
  const [form, setForm] = useState({
    title: note?.title || "",
    content: note?.content || "",
    subject: note?.subject || "General",
    color: note?.color || "default",
  });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const r = await dispatch(
      isEdit ? updateNote({ id: note._id, updates: form }) : addNote(form)
    );
    setSaving(false);
    if ((isEdit && updateNote.fulfilled.match(r)) || (!isEdit && addNote.fulfilled.match(r))) {
      toast.success(isEdit ? "Note updated" : "Note added");
      onClose();
    } else toast.error(r.payload || "Could not save");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? "Edit note" : "New note"}
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
            placeholder="Note title"
            className="input-field"
          />
          <textarea
            name="content"
            value={form.content}
            onChange={handle}
            rows={5}
            placeholder="Write your note… formulas, tricks, mistakes to avoid."
            className="input-field resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select name="subject" value={form.subject} onChange={handle} className="input-field">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.short}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              {Object.keys(COLORS).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`h-8 w-8 rounded-full ${COLOR_SWATCH[c]} ${
                    form.color === c ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-800" : ""
                  }`}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : isEdit ? "Save" : "Add note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Notes;
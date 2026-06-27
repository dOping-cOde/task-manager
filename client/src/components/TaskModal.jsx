import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";

import { addTask, updateTask } from "../features/tasks/tasksSlice";
import { CATEGORIES, PRIORITIES } from "../lib/constants";
import { dateKey } from "../lib/dates";

/**
 * Modal for creating a new task or editing an existing one.
 * - `task`        → edit mode
 * - `defaultDate` → prefill the due date (used by the calendar's "add" button)
 */
const TaskModal = ({ isOpen, onClose, task, defaultDate }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(task);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "General",
    dueDate: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: task?.title || "",
        description: task?.description || "",
        priority: task?.priority || "medium",
        category: task?.category || "General",
        dueDate: task?.dueDate
          ? dateKey(task.dueDate)
          : defaultDate
          ? dateKey(defaultDate)
          : "",
      });
    }
  }, [isOpen, task, defaultDate]);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    // Convert the date-only value to a Date the API can store (or null).
    const payload = {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };

    setSaving(true);
    const action = isEdit
      ? updateTask({ id: task._id, updates: payload })
      : addTask(payload);
    const result = await dispatch(action);
    setSaving(false);

    if (
      (isEdit && updateTask.fulfilled.match(result)) ||
      (!isEdit && addTask.fulfilled.match(result))
    ) {
      toast.success(isEdit ? "Task updated" : "Task added");
      onClose();
    } else {
      toast.error(result.payload || "Could not save task");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            {isEdit ? "Edit task" : "New task"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              autoFocus
              placeholder="e.g. Solve 30 Profit & Loss questions"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Topic, source, target time…"
              className="input-field resize-none"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subject
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, category: c.value }))
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                    form.category === c.value
                      ? c.color + " ring-2 ring-brand-300"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                  title={c.value}
                >
                  <span className="text-base">{c.emoji}</span>
                  {c.short}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Priority */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Priority
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, priority: p.value }))
                    }
                    className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                      form.priority === p.value
                        ? p.color + " ring-2 ring-brand-300"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Schedule for
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="input-field py-2.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
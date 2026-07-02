import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiEdit2, FiTrash2, FiCheck, FiClock } from "react-icons/fi";

import { updateTask, deleteTask } from "../features/tasks/tasksSlice";
import { getCategory } from "../lib/constants";
import { dueLabel } from "../lib/dates";
import { useConfirm } from "./ConfirmProvider";

const priorityStyles = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

const dueTones = {
  today: "bg-brand-100 text-brand-700",
  soon: "bg-sky-100 text-sky-700",
  overdue: "bg-rose-100 text-rose-700",
  future: "bg-slate-100 text-slate-500",
};

const TaskItem = ({ task, onEdit }) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const cat = getCategory(task.category);
  const due = dueLabel(task.dueDate);

  const toggleComplete = () => {
    dispatch(updateTask({ id: task._id, updates: { completed: !task.completed } }));
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete task?",
      message: "This will permanently delete this task. This cannot be undone.",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const result = await dispatch(deleteTask(task._id));
    if (deleteTask.fulfilled.match(result)) {
      toast.success("Task deleted");
    } else {
      toast.error(result.payload || "Could not delete task");
    }
  };

  return (
    <div className="group flex animate-fade-in items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <button
        onClick={toggleComplete}
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
          task.completed
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-300 text-transparent hover:border-brand-400"
        }`}
        title={task.completed ? "Mark as not done" : "Mark as done"}
      >
        <FiCheck className="text-sm" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <h4
          className={`font-semibold ${
            task.completed ? "text-slate-400 line-through" : "text-slate-800"
          }`}
        >
          {task.title}
        </h4>

        {task.description && (
          <p
            className={`mt-1 text-sm ${
              task.completed ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Meta badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cat.color}`}
          >
            {cat.emoji} {cat.short}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              priorityStyles[task.priority]
            }`}
          >
            {task.priority}
          </span>
          {due && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                dueTones[due.tone]
              }`}
            >
              <FiClock className="text-[10px]" /> {due.text}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => onEdit(task)}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
          title="Edit"
        >
          <FiEdit2 />
        </button>
        <button
          onClick={handleDelete}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
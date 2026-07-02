import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiSearch, FiInbox, FiBell, FiCalendar, FiTrash2 } from "react-icons/fi";

import { fetchTasks, remindMe, deleteAllTasks } from "../features/tasks/tasksSlice";
import TaskItem from "../components/TaskItem";
import TaskModal from "../components/TaskModal";
import { CATEGORIES } from "../lib/constants";
import { dateKey, todayKey } from "../lib/dates";
import useInfiniteScroll from "../lib/useInfiniteScroll";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const Dashboard = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((t) => t.completed).length;
    return { total, completed, active: total - completed };
  }, [items]);

  const visibleTasks = useMemo(() => {
    const today = todayKey();
    return items
      .filter((t) => {
        if (statusFilter === "active") return !t.completed;
        if (statusFilter === "completed") return t.completed;
        return true;
      })
      .filter((t) => (subject === "all" ? true : t.category === subject))
      .filter((t) => !todayOnly || (t.dueDate && dateKey(t.dueDate) === today))
      .filter((t) =>
        t.title.toLowerCase().includes(search.trim().toLowerCase())
      );
  }, [items, statusFilter, subject, search, todayOnly]);

  // Only render a growing slice so a huge list stays fast. resetKey ties the
  // window to the active filters (not to task edits), so it pages back to the
  // top when filters change but not when you complete/edit a task.
  const { visible, hasMore, sentinelRef } = useInfiniteScroll(visibleTasks, {
    pageSize: 15,
    resetKey: `${statusFilter}|${subject}|${search}|${todayOnly}`,
  });

  const [reminding, setReminding] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };
  const openEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        `Delete all ${items.length} task${items.length === 1 ? "" : "s"}? This cannot be undone.`
      )
    )
      return;
    setDeletingAll(true);
    const result = await dispatch(deleteAllTasks());
    setDeletingAll(false);
    if (deleteAllTasks.fulfilled.match(result)) {
      toast.success("All tasks deleted", { icon: "🗑️" });
    } else {
      toast.error(result.payload || "Could not delete tasks");
    }
  };

  const handleRemind = async () => {
    setReminding(true);
    const result = await dispatch(remindMe());
    setReminding(false);
    if (remindMe.fulfilled.match(result)) {
      toast.success(result.payload.message, { icon: "✉️" });
    } else {
      toast.error(result.payload || "Could not send reminder");
    }
  };

  return (
    <div>
      {/* Greeting + stats */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Hello, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Stay consistent — every task done gets you closer to cracking CGL.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Total" value={stats.total} accent="text-slate-900" />
          <StatCard label="Active" value={stats.active} accent="text-brand-600" />
          <StatCard
            label="Completed"
            value={stats.completed}
            accent="text-emerald-600"
          />
        </div>
      </div>

      {/* Subject chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={subject === "all"} onClick={() => setSubject("all")}>
          All subjects
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={subject === c.value}
            onClick={() => setSubject(c.value)}
          >
            {c.emoji} {c.short}
          </Chip>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  statusFilter === f.value
                    ? "bg-brand-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setTodayOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              todayOnly
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            }`}
            title="Show only tasks due today"
          >
            <FiCalendar /> Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="input-field py-2.5 pl-10"
            />
          </div>
          {items.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="btn-ghost border border-red-200 bg-white text-red-600 hover:bg-red-50"
              title="Delete all tasks"
            >
              {deletingAll ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
              ) : (
                <FiTrash2 />
              )}
              <span className="hidden sm:inline">Delete all</span>
            </button>
          )}
          <button
            onClick={handleRemind}
            disabled={reminding}
            className="btn-ghost border border-slate-200 bg-white"
            title="Email me my pending tasks now"
          >
            {reminding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            ) : (
              <FiBell />
            )}
            <span className="hidden sm:inline">Remind me</span>
          </button>
          <button onClick={openCreate} className="btn-primary whitespace-nowrap">
            <FiPlus className="text-lg" /> New
          </button>
        </div>
      </div>

      {/* List */}
      {status === "loading" && items.length === 0 ? (
        <LoadingState />
      ) : visibleTasks.length === 0 ? (
        <EmptyState onCreate={openCreate} hasTasks={items.length > 0} />
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((task) => (
              <TaskItem key={task._id} task={task} onEdit={openEdit} />
            ))}
          </div>
          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex justify-center py-6 text-sm text-slate-400"
            >
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            </div>
          )}
        </>
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editingTask}
      />
    </div>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className={`mt-1 text-3xl font-extrabold ${accent}`}>{value}</p>
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

const LoadingState = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white"
      />
    ))}
  </div>
);

const EmptyState = ({ onCreate, hasTasks }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500">
      <FiInbox className="text-3xl" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-800">
      {hasTasks ? "No matching tasks" : "No tasks yet"}
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500">
      {hasTasks
        ? "Try a different subject, filter or search."
        : "Add your first study task and start earning XP."}
    </p>
    {!hasTasks && (
      <button onClick={onCreate} className="btn-primary mt-5">
        <FiPlus /> Add your first task
      </button>
    )}
  </div>
);

export default Dashboard;
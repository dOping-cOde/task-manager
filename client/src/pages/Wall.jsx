import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiCheck, FiEdit2, FiCalendar } from "react-icons/fi";

import { fetchTasks, updateTask } from "../features/tasks/tasksSlice";
import TaskModal from "../components/TaskModal";
import { getCategory } from "../lib/constants";
import { dueLabel, dateKey, todayKey, isTaskForToday } from "../lib/dates";
import useInfiniteScroll from "../lib/useInfiniteScroll";

// Warm sticky-note paper palette, keyed to each CGL subject. These are
// deliberately richer than the chip colors so the notes read as real paper.
const NOTE_PAPER = {
  "Quantitative Aptitude": { bg: "#bfe3ff", edge: "#9fd0f5", ink: "#0c4a6e" },
  Reasoning: { bg: "#e3d4ff", edge: "#cdb6f7", ink: "#4c1d95" },
  English: { bg: "#ffd0e0", edge: "#f7b4cb", ink: "#9d174d" },
  "General Awareness": { bg: "#fff1a8", edge: "#f5e07e", ink: "#854d0e" },
  General: { bg: "#d7f5cf", edge: "#bce8b0", ink: "#166534" },
};
const paperFor = (cat) => NOTE_PAPER[cat] || NOTE_PAPER.General;

// Pin colors cycle so the board looks hand-pinned, not generated.
const PINS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

// Deterministic 0..n hash from the Mongo _id so each note keeps the SAME
// tilt and pin across renders (re-randomizing on every paint looks janky).
const hash = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

const TONE_RIBBON = {
  overdue: "bg-red-600 text-white",
  today: "bg-emerald-600 text-white",
  soon: "bg-amber-500 text-white",
  future: "bg-slate-700/80 text-white",
};

const Wall = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.tasks);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDone, setShowDone] = useState(true);
  const [todayOnly, setTodayOnly] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Every task gets pinned to the wall. Dated tasks come first, sorted
  // soonest-first so the most urgent paper sits top-left; undated tasks
  // (added without a due date) follow so they're never hidden.
  const notes = useMemo(() => {
    return items
      .filter((t) => showDone || !t.completed)
      .filter((t) => !todayOnly || isTaskForToday(t))
      .slice()
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
  }, [items, showDone, todayOnly]);

  const overdueCount = useMemo(
    () =>
      notes.filter(
        (t) => t.dueDate && !t.completed && dateKey(t.dueDate) < todayKey()
      ).length,
    [notes]
  );

  // Pin only a growing slice so a wall with hundreds of notes stays smooth.
  const { visible, hasMore, sentinelRef } = useInfiniteScroll(notes, {
    pageSize: 24,
    resetKey: `${showDone}|${todayOnly}`,
  });

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };
  const openEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const toggleComplete = (task, e) => {
    e.stopPropagation();
    dispatch(updateTask({ id: task._id, updates: { completed: !task.completed } }));
  };

  return (
    <div
      className="-mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-x-hidden sm:-mx-6"
      style={WALL_STYLE}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="text-3xl font-extrabold tracking-tight text-amber-50 drop-shadow"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.45)" }}
            >
              📌 Study Wall
            </h1>
            <p className="text-sm font-medium text-amber-100/80">
              {notes.length} note{notes.length === 1 ? "" : "s"} pinned
              {overdueCount > 0 && (
                <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                  {overdueCount} overdue
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTodayOnly((v) => !v)}
              title="Show only tasks scheduled for or completed today"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold backdrop-blur transition ${
                todayOnly
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-black/25 text-amber-50 hover:bg-black/35"
              }`}
            >
              <FiCalendar /> Today
            </button>
            <button
              onClick={() => setShowDone((v) => !v)}
              className="rounded-lg bg-black/25 px-3 py-2 text-sm font-semibold text-amber-50 backdrop-blur transition hover:bg-black/35"
            >
              {showDone ? "Hide done" : "Show done"}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700"
            >
              <FiPlus /> Pin a task
            </button>
          </div>
        </div>

        {/* Hanging cords + nail */}
        <div className="relative mx-auto mt-6 max-w-5xl">
          <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center">
            <div className="h-3 w-3 rounded-full bg-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.6)] ring-2 ring-slate-500/40" />
          </div>
          <div className="pointer-events-none absolute -top-5 left-1/2 h-24 w-px origin-top -translate-x-1/2 rotate-[26deg] bg-gradient-to-b from-amber-900/70 to-amber-700/40" />
          <div className="pointer-events-none absolute -top-5 left-1/2 h-24 w-px origin-top -translate-x-1/2 -rotate-[26deg] bg-gradient-to-b from-amber-900/70 to-amber-700/40" />

          {/* Cork board inside a wooden frame */}
          <div className="rounded-[28px] p-3 shadow-2xl" style={FRAME_STYLE}>
            <div
              className="relative min-h-[60vh] overflow-hidden rounded-[18px] p-6"
              style={CORK_STYLE}
            >
              {status === "loading" && notes.length === 0 ? (
                <div className="grid place-items-center py-24 text-amber-50/70">
                  Loading your wall…
                </div>
              ) : notes.length === 0 ? (
                <EmptyWall onAdd={openCreate} />
              ) : (
                <>
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 py-4">
                    {visible.map((task) => (
                      <StickyNote
                        key={task._id}
                        task={task}
                        onEdit={openEdit}
                        onToggle={toggleComplete}
                      />
                    ))}
                  </div>
                  {hasMore && (
                    <div
                      ref={sentinelRef}
                      className="flex justify-center py-6 text-amber-50/70"
                    >
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-50/40 border-t-amber-50" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editingTask}
      />
    </div>
  );
};

const StickyNote = ({ task, onEdit, onToggle }) => {
  const paper = paperFor(task.category);
  const cat = getCategory(task.category);
  const h = hash(task._id);
  const rotate = ((h % 7) - 3) * 1.1; // -3.3deg .. +3.3deg
  const pin = PINS[h % PINS.length];
  const due = dueLabel(task.dueDate);

  return (
    <div
      onClick={() => onEdit(task)}
      className="group relative cursor-pointer transition-transform duration-200 ease-out hover:z-10 hover:!rotate-0 hover:-translate-y-1.5 hover:scale-[1.03]"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Push pin */}
      <span
        className="absolute -top-3 left-1/2 z-10 h-5 w-5 -translate-x-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, #fff8, ${pin} 45%, rgba(0,0,0,0.35) 100%)`,
          boxShadow: "0 3px 5px rgba(0,0,0,0.4)",
        }}
      >
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      </span>

      {/* Paper */}
      <div
        className="relative h-48 w-48 p-4 shadow-[0_10px_18px_-6px_rgba(0,0,0,0.5)]"
        style={{
          background: `linear-gradient(135deg, ${paper.bg} 0%, ${paper.edge} 100%)`,
          color: paper.ink,
          clipPath: "polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)", // dog-ear
        }}
      >
        {/* Subject + due ribbon */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg" title={task.category}>
            {cat.emoji}
          </span>
          {due && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow ${
                TONE_RIBBON[due.tone] || TONE_RIBBON.future
              }`}
            >
              {due.text}
            </span>
          )}
        </div>

        {/* Title + note — real handwritten font (Caveat) */}
        <p className="font-hand text-2xl font-bold leading-[1.15] line-clamp-2">
          {task.title}
        </p>
        {task.description && (
          <p className="font-hand mt-1 text-lg leading-tight line-clamp-2 opacity-80">
            {task.description}
          </p>
        )}

        {/* Priority dot + footer actions */}
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase opacity-70">
            {task.priority}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => onToggle(task, e)}
              title={task.completed ? "Mark as not done" : "Mark done"}
              className={`grid h-7 w-7 place-items-center rounded-full border-2 transition ${
                task.completed
                  ? "border-emerald-700 bg-emerald-600 text-white"
                  : "border-current/40 bg-white/50 hover:bg-white/80"
              }`}
              style={{ borderColor: task.completed ? "" : paper.ink }}
            >
              <FiCheck className="text-sm" />
            </button>
            <span
              className="grid h-7 w-7 place-items-center rounded-full bg-white/50 opacity-0 transition group-hover:opacity-100"
              title="Edit"
            >
              <FiEdit2 className="text-xs" />
            </span>
          </div>
        </div>

        {/* DONE rubber stamp */}
        {task.completed && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-md border-4 border-red-600/70 px-3 py-1 text-2xl font-black uppercase tracking-widest text-red-600/70"
            style={{ textShadow: "0 0 1px rgba(0,0,0,0.1)" }}
          >
            Done
          </span>
        )}
      </div>
    </div>
  );
};

const EmptyWall = ({ onAdd }) => (
  <div className="grid place-items-center py-24 text-center">
    <div className="rounded-2xl bg-black/15 px-8 py-10 backdrop-blur">
      <p className="text-5xl">🧷</p>
      <p className="mt-3 text-lg font-bold text-amber-50">Your wall is empty</p>
      <p className="mt-1 text-sm text-amber-100/80">
        Schedule a task with a due date and it gets pinned here.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-brand-700"
      >
        Pin your first task
      </button>
    </div>
  </div>
);

// --- Textures (pure CSS, no image assets) ---

// Warm plaster wall with soft vignette.
const WALL_STYLE = {
  background:
    "radial-gradient(120% 80% at 50% -10%, #6b5840 0%, #4a3d2c 55%, #3a2f22 100%)",
};

// Wooden frame — layered gradients fake a grain + bevel.
const FRAME_STYLE = {
  background:
    "repeating-linear-gradient(115deg, #8a5a2b 0px, #a06a33 6px, #7c4f26 12px, #95612f 18px)",
  boxShadow:
    "inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.45), 0 20px 40px -12px rgba(0,0,0,0.6)",
};

// Cork board — base tan plus stippled dots for the cork grain.
const CORK_STYLE = {
  backgroundColor: "#c9a36a",
  backgroundImage:
    "radial-gradient(rgba(120,72,30,0.35) 1px, transparent 1.4px), radial-gradient(rgba(90,55,20,0.25) 1px, transparent 1.4px)",
  backgroundSize: "10px 10px, 16px 16px",
  backgroundPosition: "0 0, 6px 8px",
  boxShadow: "inset 0 0 60px rgba(60,35,10,0.55)",
};

export default Wall;

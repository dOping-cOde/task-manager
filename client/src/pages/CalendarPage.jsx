import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";

import { fetchTasks } from "../features/tasks/tasksSlice";
import TaskItem from "../components/TaskItem";
import TaskModal from "../components/TaskModal";
import { getCategory } from "../lib/constants";
import {
  MONTH_NAMES,
  WEEKDAYS,
  buildMonthGrid,
  dateKey,
  todayKey,
} from "../lib/dates";

const CalendarPage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.tasks);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayKey());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Group scheduled tasks by their due-date key.
  const byDate = useMemo(() => {
    const map = {};
    items.forEach((t) => {
      if (!t.dueDate) return;
      const k = dateKey(t.dueDate);
      (map[k] ||= []).push(t);
    });
    return map;
  }, [items]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const selectedTasks = byDate[selected] || [];

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(todayKey());
  };

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };
  const openEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {MONTH_NAMES[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={goToday} className="btn-ghost text-brand-600">
                Today
              </button>
              <button
                onClick={goPrev}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={goNext}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date) => {
              const key = dateKey(date);
              const inMonth = date.getMonth() === month;
              const isToday = key === todayKey();
              const isSelected = key === selected;
              const dayTasks = byDate[key] || [];

              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`flex min-h-[68px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[84px] ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-300"
                      : "border-slate-100 hover:border-brand-200 hover:bg-slate-50"
                  } ${inMonth ? "" : "opacity-40"}`}
                >
                  <span
                    className={`mb-1 grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                      isToday
                        ? "bg-brand-600 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {/* Category dots */}
                  <div className="flex flex-wrap gap-0.5">
                    {dayTasks.slice(0, 4).map((t) => (
                      <span
                        key={t._id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          getCategory(t.category).dot
                        } ${t.completed ? "opacity-40" : ""}`}
                      />
                    ))}
                    {dayTasks.length > 4 && (
                      <span className="text-[9px] font-bold text-slate-400">
                        +{dayTasks.length - 4}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected-day panel */}
      <div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {selected === todayKey() ? "Today" : "Scheduled"}
              </p>
              <h3 className="text-lg font-bold text-slate-900">
                {new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>
            <button
              onClick={openCreate}
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow hover:bg-brand-700"
              title="Add task for this day"
            >
              <FiPlus className="text-lg" />
            </button>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
              Nothing scheduled.
              <br />
              Tap + to plan a study session.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTasks.map((task) => (
                <TaskItem key={task._id} task={task} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editingTask}
        defaultDate={editingTask ? null : selected + "T00:00:00"}
      />
    </div>
  );
};

export default CalendarPage;
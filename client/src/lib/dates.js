// Local-time YYYY-MM-DD key (avoids UTC off-by-one from toISOString).
export const dateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayKey = () => dateKey(new Date());

// Friendly relative label for a due date: Today / Tomorrow / Overdue / date.
export const dueLabel = (iso) => {
  if (!iso) return null;
  const key = dateKey(iso);
  const today = todayKey();
  const tomorrow = dateKey(new Date(Date.now() + 86400000));

  if (key === today) return { text: "Today", tone: "today" };
  if (key === tomorrow) return { text: "Tomorrow", tone: "soon" };
  if (key < today) return { text: "Overdue", tone: "overdue" };

  return {
    text: new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    tone: "future",
  };
};

// A task belongs to "Today" if it's scheduled for today OR was completed
// today. `completedAt` may be missing on older tasks, so fall back to
// `updatedAt` for those (a task done today was, by definition, updated today).
export const isTaskForToday = (task) => {
  const today = todayKey();
  const dueToday = task.dueDate && dateKey(task.dueDate) === today;
  const doneToday =
    task.completed &&
    dateKey(task.completedAt || task.updatedAt) === today;
  return Boolean(dueToday || doneToday);
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Build a 6x7 grid (42 cells) of Date objects for a month view,
 * including leading/trailing days from adjacent months.
 */
export const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
};
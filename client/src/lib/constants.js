// CGL subjects — keys must match the server's Task category enum exactly.
export const CATEGORIES = [
  {
    value: "Quantitative Aptitude",
    short: "Quant",
    emoji: "🔢",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },
  {
    value: "Reasoning",
    short: "Reasoning",
    emoji: "🧩",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
  },
  {
    value: "English",
    short: "English",
    emoji: "📘",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
  },
  {
    value: "General Awareness",
    short: "GA",
    emoji: "🌐",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  {
    value: "General",
    short: "General",
    emoji: "🗂️",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
  },
];

export const getCategory = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

export const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "high", label: "High", color: "bg-rose-100 text-rose-700 border-rose-200" },
];
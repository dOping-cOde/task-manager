import { useState, useEffect, useMemo } from "react";
import { FiHash, FiSearch, FiDownload, FiPrinter } from "react-icons/fi";

// Reference "kit" of the maths facts SSC-CGL aspirants revise daily. Most of it
// is computed (tables, squares, cubes, fraction %), so it's always accurate;
// only the Pythagorean triplets are a fixed known set.

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const SECTIONS = [
  { key: "tables", label: "Tables 11–30" },
  { key: "squares", label: "Squares 1–50" },
  { key: "cubes", label: "Cubes 1–30" },
  { key: "pythagoras", label: "Pythagoras" },
  { key: "fractions", label: "Fraction → %" },
];

// Pythagorean triplets (a² + b² = c²) commonly used in the exam.
const TRIPLETS = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
  [20, 21, 29], [12, 35, 37], [9, 40, 41], [28, 45, 53],
  [11, 60, 61], [16, 63, 65], [33, 56, 65], [48, 55, 73],
  [13, 84, 85], [36, 77, 85], [39, 80, 89], [65, 72, 97],
];

// Fractions worth memorising as percentages.
const FRACTIONS = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5],
  [1, 6], [5, 6], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  [1, 8], [3, 8], [5, 8], [7, 8], [1, 9], [2, 9], [4, 9], [5, 9], [7, 9], [8, 9],
  [1, 10], [1, 11], [1, 12], [1, 13], [1, 14], [1, 15], [1, 16], [1, 20], [1, 24], [1, 40],
];

const pct = (num, den) => {
  const v = (num / den) * 100;
  // Trim to 2 decimals, dropping trailing zeros (50.00 -> 50, 33.33 -> 33.33).
  return parseFloat(v.toFixed(2)).toString();
};

const MathsKit = () => {
  const [active, setActive] = useState("tables");
  const [query, setQuery] = useState("");
  const [pdfAvailable, setPdfAvailable] = useState(false);

  // Show the "download original PDF" button only if the file actually exists
  // (drop it at client/public/maths-kit.pdf to enable it).
  useEffect(() => {
    fetch("/maths-kit.pdf", { method: "HEAD" })
      .then((r) => setPdfAvailable(r.ok))
      .catch(() => setPdfAvailable(false));
  }, []);

  const q = query.trim();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Maths Kit
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tables, squares, cubes, Pythagoras triplets & fraction–percent — revise daily. 🔢
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-ghost border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            title="Print or save as PDF"
          >
            <FiPrinter /> <span className="hidden sm:inline">Save as PDF</span>
          </button>
          {pdfAvailable && (
            <a href="/maths-kit.pdf" download className="btn-primary">
              <FiDownload /> Download
            </a>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setActive(s.key);
              setQuery("");
            }}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              active === s.key
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search (numeric filter) */}
      {active !== "pythagoras" && (
        <div className="mb-6 relative sm:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="numeric"
            placeholder={
              active === "fractions" ? "Filter, e.g. 7" : "Jump to a number, e.g. 17"
            }
            className="input-field py-2.5 pl-10"
          />
        </div>
      )}

      {active === "tables" && <Tables q={q} />}
      {active === "squares" && <Squares q={q} />}
      {active === "cubes" && <Cubes q={q} />}
      {active === "pythagoras" && <Pythagoras />}
      {active === "fractions" && <Fractions q={q} />}
    </div>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800 ${className}`}
  >
    {children}
  </div>
);

const Tables = ({ q }) => {
  const tables = useMemo(() => {
    const all = range(11, 30);
    return q ? all.filter((n) => String(n).includes(q)) : all;
  }, [q]);

  if (!tables.length) return <Empty />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tables.map((n) => (
        <Card key={n}>
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-2.5 py-1 text-sm font-extrabold text-white">
            <FiHash className="text-xs" /> {n}
          </div>
          <div className="space-y-0.5 font-mono text-sm text-slate-600 dark:text-slate-300">
            {range(1, 10).map((i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-400">
                  {n} × {i}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {n * i}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

const Squares = ({ q }) => {
  const nums = useMemo(() => {
    const all = range(1, 50);
    return q ? all.filter((n) => String(n).includes(q)) : all;
  }, [q]);
  if (!nums.length) return <Empty />;
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {nums.map((n) => (
        <Card key={n} className="!p-3">
          <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
            {n}²
          </p>
          <p className="font-mono text-xl font-extrabold text-brand-600">
            {n * n}
          </p>
        </Card>
      ))}
    </div>
  );
};

const Cubes = ({ q }) => {
  const nums = useMemo(() => {
    const all = range(1, 30);
    return q ? all.filter((n) => String(n).includes(q)) : all;
  }, [q]);
  if (!nums.length) return <Empty />;
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {nums.map((n) => (
        <Card key={n} className="!p-3">
          <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
            {n}³
          </p>
          <p className="font-mono text-xl font-extrabold text-emerald-600">
            {n * n * n}
          </p>
        </Card>
      ))}
    </div>
  );
};

const Pythagoras = () => (
  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
    {TRIPLETS.map(([a, b, c]) => (
      <Card key={`${a}-${b}-${c}`} className="!p-3 text-center">
        <p className="font-mono text-lg font-extrabold text-slate-800 dark:text-slate-100">
          {a}, {b}, {c}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
          {a}² + {b}² = {c}²
        </p>
      </Card>
    ))}
  </div>
);

const Fractions = ({ q }) => {
  const rows = useMemo(() => {
    return q
      ? FRACTIONS.filter(([n, d]) => `${n}/${d}`.includes(q) || String(d).includes(q))
      : FRACTIONS;
  }, [q]);
  if (!rows.length) return <Empty />;
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
      {rows.map(([n, d]) => (
        <Card key={`${n}-${d}`} className="!p-3 flex items-center justify-between">
          <span className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
            {n}/{d}
          </span>
          <span className="font-mono text-lg font-extrabold text-brand-600">
            {pct(n, d)}%
          </span>
        </Card>
      ))}
    </div>
  );
};

const Empty = () => (
  <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800">
    No match — try a different number.
  </p>
);

export default MathsKit;

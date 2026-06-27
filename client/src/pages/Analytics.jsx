import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiClock,
  FiCheckCircle,
  FiBarChart2,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import { fetchOverview } from "../features/analytics/analyticsSlice";
import { getCategory } from "../lib/constants";

// Subject -> hex used by the recharts bars (Tailwind palette match).
const SUBJECT_HEX = {
  "Quantitative Aptitude": "#0ea5e9",
  Reasoning: "#8b5cf6",
  English: "#f43f5e",
  "General Awareness": "#f59e0b",
  General: "#94a3b8",
};
const subjectHex = (subject) => SUBJECT_HEX[getCategory(subject).value] || "#6366f1";

const AXIS = "#94a3b8";
const GRID = "#e2e8f0";

// Short "Jun 25" label from a YYYY-MM-DD key.
const shortDay = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e2e8f0",
  fontSize: "0.8rem",
};

const Analytics = () => {
  const dispatch = useDispatch();
  const { overview, status } = useSelector((s) => s.analytics);

  useEffect(() => {
    dispatch(fetchOverview());
  }, [dispatch]);

  if (status === "loading" || (status === "idle" && !overview)) {
    return <Skeleton />;
  }

  if (!overview) {
    return (
      <EmptyState message="We couldn't load your analytics. Please try again." />
    );
  }

  const { tasks, study, mocks } = overview;

  const hasData =
    tasks.total > 0 || study.sessions > 0 || mocks.count > 0;

  if (!hasData) {
    return (
      <EmptyState message="No data yet — complete some tasks, log a study session, or record a mock test to see your analytics come to life." />
    );
  }

  const studyHours = (study.totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Analytics
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your study, task, and mock-test trends at a glance.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={FiClock}
          label="Study hours"
          value={`${studyHours}h`}
          tone="text-sky-600 dark:text-sky-400"
        />
        <Kpi
          icon={FiCheckCircle}
          label="Tasks done"
          value={tasks.completed}
          hint={`${tasks.completionRate}% completion`}
          tone="text-emerald-600 dark:text-emerald-400"
        />
        <Kpi
          icon={FiBarChart2}
          label="Mock average"
          value={`${mocks.avgPercent}%`}
          tone="text-violet-600 dark:text-violet-400"
        />
        <Kpi
          icon={FiAward}
          label="Best mock"
          value={`${mocks.bestPercent}%`}
          tone="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Study minutes per day */}
        <ChartCard
          title="Study minutes"
          caption="Minutes studied each day over the last 14 days."
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={study.minutesByDay}>
              <defs>
                <linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                stroke={AXIS}
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke={AXIS} fontSize={11} tickLine={false} width={32} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={shortDay}
                formatter={(v) => [`${v} min`, "Studied"]}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#studyFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tasks completed per day */}
        <ChartCard
          title="Tasks completed"
          caption="Tasks you finished each day over the last 14 days."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tasks.completedByDay}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                stroke={AXIS}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke={AXIS}
                fontSize={11}
                tickLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={shortDay}
                formatter={(v) => [v, "Completed"]}
                cursor={{ fill: "#94a3b81a" }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Study minutes by subject */}
        <ChartCard
          title="Time by subject"
          caption="Total minutes studied per subject."
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={study.minutesBySubject}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <CartesianGrid
                stroke={GRID}
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke={AXIS}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="subject"
                stroke={AXIS}
                fontSize={11}
                tickLine={false}
                width={120}
                tickFormatter={(s) => getCategory(s).short}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${v} min`, "Studied"]}
                cursor={{ fill: "#94a3b81a" }}
              />
              <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                {study.minutesBySubject.map((entry) => (
                  <Cell key={entry.subject} fill={subjectHex(entry.subject)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Mock score % trend */}
        <ChartCard
          title="Mock score trend"
          caption="Your mock-test percentage over time."
        >
          {mocks.count === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-400 dark:text-slate-500">
              <FiTrendingUp className="mr-2" /> No mock tests recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mocks.trend}>
                <CartesianGrid
                  stroke={GRID}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDay}
                  stroke={AXIS}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={AXIS}
                  fontSize={11}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={shortDay}
                  formatter={(v, _n, p) => [`${v}%`, p?.payload?.name || "Mock"]}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#8b5cf6" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

const Kpi = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="card p-4">
    <div className={`mb-2 flex items-center gap-2 ${tone}`}>
      <Icon className="text-lg" />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
      {value}
    </p>
    {hint && (
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
    )}
  </div>
);

const ChartCard = ({ title, caption, children }) => (
  <div className="card p-5">
    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
      {title}
    </h3>
    <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">{caption}</p>
    {children}
  </div>
);

const Skeleton = () => (
  <div className="space-y-8">
    <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse p-4" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-[320px] animate-pulse p-5" />
      ))}
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
    <FiBarChart2 className="text-4xl text-slate-300 dark:text-slate-600" />
    <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
      {message}
    </p>
  </div>
);

export default Analytics;
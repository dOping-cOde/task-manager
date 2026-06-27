import mongoose from "mongoose";
import Task from "../models/Task.js";
import StudySession from "../models/StudySession.js";
import MockTest from "../models/MockTest.js";

// Local-time YYYY-MM-DD key — mirrors the client's dateKey to avoid UTC
// off-by-one. Bucketing happens in plain JS rather than $dateToString so the
// server's local timezone is the single source of truth.
const dateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Ordered list of the last `n` local-day keys, oldest first.
const lastNDays = (n) => {
  const keys = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
};

// Earliest Date covered by the last `n` days (local midnight), for find filters.
const sinceNDaysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  return d;
};

const WINDOW = 14;

const pct = (score, max) =>
  max > 0 ? Math.round((Number(score) / Number(max)) * 100) : 0;

/**
 * @desc    Aggregated analytics overview for the logged-in user
 * @route   GET /api/analytics/overview
 * @access  Private
 */
export const getOverview = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const since = sinceNDaysAgo(WINDOW);
    const days = lastNDays(WINDOW);

    // --- Tasks ---------------------------------------------------------------
    const tasks = await Task.find({ user: userId })
      .select("completed createdAt")
      .lean();

    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const taskCounts = Object.fromEntries(days.map((d) => [d, 0]));
    tasks.forEach((t) => {
      if (!t.completed) return;
      const key = dateKey(t.createdAt);
      if (key in taskCounts) taskCounts[key] += 1;
    });
    const completedByDay = days.map((date) => ({ date, count: taskCounts[date] }));

    // --- Study sessions ------------------------------------------------------
    const sessions = await StudySession.find({ user: userId })
      .select("durationMin subject date")
      .lean();

    const totalMinutes = sessions.reduce(
      (sum, s) => sum + (Number(s.durationMin) || 0),
      0
    );

    const minuteBuckets = Object.fromEntries(days.map((d) => [d, 0]));
    sessions.forEach((s) => {
      const key = dateKey(s.date);
      if (key in minuteBuckets) minuteBuckets[key] += Number(s.durationMin) || 0;
    });
    const minutesByDay = days.map((date) => ({
      date,
      minutes: minuteBuckets[date],
    }));

    const subjectBuckets = {};
    sessions.forEach((s) => {
      const subject = s.subject || "General";
      subjectBuckets[subject] =
        (subjectBuckets[subject] || 0) + (Number(s.durationMin) || 0);
    });
    const minutesBySubject = Object.entries(subjectBuckets).map(
      ([subject, minutes]) => ({ subject, minutes })
    );

    // --- Mock tests ----------------------------------------------------------
    const mocks = await MockTest.find({ user: userId })
      .select("name date score maxScore")
      .sort({ date: 1 })
      .lean();

    const percents = mocks.map((m) => pct(m.score, m.maxScore));
    const count = mocks.length;
    const avgPercent =
      count === 0
        ? 0
        : Math.round(percents.reduce((a, b) => a + b, 0) / count);
    const bestPercent = count === 0 ? 0 : Math.max(...percents);
    const lastPercent = count === 0 ? 0 : percents[percents.length - 1];
    const trend = mocks.map((m) => ({
      date: dateKey(m.date),
      percent: pct(m.score, m.maxScore),
      name: m.name,
    }));

    res.json({
      tasks: { total, completed, active, completionRate, completedByDay },
      study: {
        totalMinutes,
        sessions: sessions.length,
        minutesByDay,
        minutesBySubject,
      },
      mocks: { count, avgPercent, bestPercent, lastPercent, trend },
    });
  } catch (error) {
    next(error);
  }
};
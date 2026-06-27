// ---------------------------------------------------------------------------
// Gamification engine — XP, levels, streaks and achievements.
// Kept framework-agnostic and pure so it's easy to reason about and test.
// ---------------------------------------------------------------------------

// XP awarded the FIRST time a task is completed, by priority.
export const XP_BY_PRIORITY = { low: 10, medium: 20, high: 30 };

// Bonus for completing a task on or before its scheduled due date.
export const ONTIME_BONUS = 10;

// CGL subjects the app understands (must stay in sync with the client).
export const CATEGORIES = [
  "Quantitative Aptitude",
  "Reasoning",
  "English",
  "General Awareness",
  "General",
];

/**
 * Cumulative XP required to *reach* a given level.
 * Triangular curve: L1=0, L2=100, L3=300, L4=600, L5=1000 ...
 */
export const xpForLevel = (level) => 50 * (level - 1) * level;

/** Resolve the level for a given XP total. */
export const levelFromXp = (xp) => {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
};

/** Progress details used to render the XP bar. */
export const levelProgress = (xp) => {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - start;
  return {
    level,
    xpIntoLevel: xp - start,
    xpForLevelSpan: span,
    progressPct: Math.round(((xp - start) / span) * 100),
  };
};

// --- Date helpers (YYYY-MM-DD in server local time) ---
const toKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Advance a streak given the last active day-key.
 * Returns the updated { current, longest, lastDate }.
 */
export const bumpStreak = (streak, now = new Date()) => {
  const today = toKey(now);
  const yesterday = toKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  let current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const lastDate = streak?.lastDate || null;

  if (lastDate === today) {
    // Already counted today — no change.
  } else if (lastDate === yesterday) {
    current += 1;
  } else {
    current = 1;
  }

  return {
    current,
    longest: Math.max(longest, current),
    lastDate: today,
  };
};

// ---------------------------------------------------------------------------
// Achievements — each has a predicate over the user's gamification stats.
// `key` is stored on the user; metadata for display lives on the client too.
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
  { key: "first_step", test: (s) => s.completedCount >= 1 },
  { key: "ten_done", test: (s) => s.completedCount >= 10 },
  { key: "fifty_done", test: (s) => s.completedCount >= 50 },
  { key: "century", test: (s) => s.completedCount >= 100 },
  { key: "streak_3", test: (s) => s.streak.current >= 3 },
  { key: "streak_7", test: (s) => s.streak.current >= 7 },
  { key: "streak_30", test: (s) => s.streak.current >= 30 },
  { key: "level_5", test: (s) => levelFromXp(s.xp) >= 5 },
  { key: "level_10", test: (s) => levelFromXp(s.xp) >= 10 },
  {
    // Completed at least one task in each of the four core CGL subjects.
    key: "all_rounder",
    test: (s) =>
      ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"].every(
        (c) => (s.completedByCategory?.[c] || 0) >= 1
      ),
  },
];

/**
 * Given current stats and already-unlocked keys, return the keys newly unlocked.
 */
export const evaluateAchievements = (stats, unlocked = []) => {
  const have = new Set(unlocked);
  return ACHIEVEMENTS.filter((a) => !have.has(a.key) && a.test(stats)).map(
    (a) => a.key
  );
};
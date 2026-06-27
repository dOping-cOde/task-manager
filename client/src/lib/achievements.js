// Display metadata for achievement keys awarded by the server.
export const ACHIEVEMENTS = {
  first_step: {
    title: "First Step",
    desc: "Complete your first task",
    emoji: "🌱",
  },
  ten_done: {
    title: "Getting Serious",
    desc: "Complete 10 tasks",
    emoji: "🔥",
  },
  fifty_done: {
    title: "Half Century",
    desc: "Complete 50 tasks",
    emoji: "💪",
  },
  century: {
    title: "Centurion",
    desc: "Complete 100 tasks",
    emoji: "🏆",
  },
  streak_3: {
    title: "On a Roll",
    desc: "3-day study streak",
    emoji: "⚡",
  },
  streak_7: {
    title: "Week Warrior",
    desc: "7-day study streak",
    emoji: "📅",
  },
  streak_30: {
    title: "Unstoppable",
    desc: "30-day study streak",
    emoji: "🚀",
  },
  level_5: {
    title: "Rising Scholar",
    desc: "Reach level 5",
    emoji: "⭐",
  },
  level_10: {
    title: "Master Aspirant",
    desc: "Reach level 10",
    emoji: "👑",
  },
  all_rounder: {
    title: "All-Rounder",
    desc: "Complete a task in every core subject",
    emoji: "🎯",
  },
};

// Stable order for the achievements grid.
export const ACHIEVEMENT_ORDER = [
  "first_step",
  "ten_done",
  "fifty_done",
  "century",
  "streak_3",
  "streak_7",
  "streak_30",
  "level_5",
  "level_10",
  "all_rounder",
];
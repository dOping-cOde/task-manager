import { levelProgress } from "../utils/gamification.js";

/**
 * @desc    Get the logged-in user's gamification stats
 * @route   GET /api/stats
 * @access  Private
 */
export const getStats = async (req, res) => {
  const user = req.user;
  const progress = levelProgress(user.xp);

  res.json({
    xp: user.xp,
    level: progress.level,
    xpIntoLevel: progress.xpIntoLevel,
    xpForLevelSpan: progress.xpForLevelSpan,
    progressPct: progress.progressPct,
    streak: {
      current: user.streak?.current || 0,
      longest: user.streak?.longest || 0,
    },
    achievements: user.achievements || [],
    completedCount: user.completedCount || 0,
    completedByCategory: user.completedByCategory
      ? Object.fromEntries(user.completedByCategory)
      : {},
  });
};
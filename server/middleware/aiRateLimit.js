/**
 * Per-user daily limit for AI requests, to protect the free LLM quota.
 *
 * - Default limit: 2 AI requests/day (override with AI_DAILY_LIMIT).
 * - Exempt: the developer email (DEVELOPER_EMAIL) and any admin user.
 * - Resets each calendar day in the configured timezone.
 */
const DEVELOPER_EMAIL = (process.env.DEVELOPER_EMAIL || "arun2001.gkp@gmail.com").toLowerCase();
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 2);
const TZ = process.env.REMINDER_TZ || "Asia/Kolkata";

// Today's date as YYYY-MM-DD in the configured timezone.
const todayKey = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: TZ });

export const aiRateLimit = async (req, res, next) => {
  try {
    const user = req.user;

    // Developer and admins are never rate limited.
    if (user.role === "admin" || (user.email || "").toLowerCase() === DEVELOPER_EMAIL) {
      return next();
    }

    const today = todayKey();

    // New day → reset the counter.
    if (user.aiUsageDate !== today) {
      user.aiUsageDate = today;
      user.aiUsageCount = 0;
    }

    if (user.aiUsageCount >= DAILY_LIMIT) {
      return res.status(429).json({
        message:
          `You've used your ${DAILY_LIMIT} free AI requests for today. ` +
          `The developer is a student running this on a free AI model, so usage is ` +
          `limited to keep it free for everyone. Please come back tomorrow. 🙂`,
      });
    }

    user.aiUsageCount += 1;
    await user.save();
    next();
  } catch (error) {
    next(error);
  }
};

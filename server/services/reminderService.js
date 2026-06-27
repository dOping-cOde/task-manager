import cron from "node-cron";

import Task from "../models/Task.js";
import { sendMail } from "../utils/mailer.js";
import { reminderDigestEmail } from "../utils/emailTemplates.js";

// How many days ahead counts as "upcoming" in the digest.
const UPCOMING_DAYS = Number(process.env.REMINDER_UPCOMING_DAYS) || 3;

// Local YYYY-MM-DD key.
const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

/**
 * Bucket a user's pending tasks into overdue / today / upcoming / noDate.
 * Far-future tasks (beyond UPCOMING_DAYS) are intentionally excluded so the
 * digest stays relevant.
 */
const groupTasks = (tasks) => {
  const today = dayKey(new Date());
  const horizon = dayKey(new Date(Date.now() + UPCOMING_DAYS * 86400000));

  const groups = { overdue: [], today: [], upcoming: [], noDate: [] };
  for (const t of tasks) {
    if (!t.dueDate) {
      groups.noDate.push(t);
      continue;
    }
    const dk = dayKey(t.dueDate);
    if (dk < today) groups.overdue.push(t);
    else if (dk === today) groups.today.push(t);
    else if (dk <= horizon) groups.upcoming.push(t);
    // else: too far out — skip from this digest
  }
  return groups;
};

/**
 * Build and send the pending-task digest to every user who has something
 * relevant pending. `period` is "Morning" / "Evening" (used in the subject).
 * Returns the number of emails sent.
 */
export const sendReminders = async (period = "Daily") => {
  const tasks = await Task.find({ completed: false }).populate(
    "user",
    "name email"
  );

  // Group pending tasks by their owner.
  const byUser = new Map();
  for (const t of tasks) {
    if (!t.user) continue; // orphaned task safety
    const id = t.user._id.toString();
    if (!byUser.has(id)) byUser.set(id, { user: t.user, tasks: [] });
    byUser.get(id).tasks.push(t);
  }

  let sent = 0;
  for (const { user, tasks: userTasks } of byUser.values()) {
    const groups = groupTasks(userTasks);
    const relevant =
      groups.overdue.length +
      groups.today.length +
      groups.upcoming.length +
      groups.noDate.length;

    if (relevant === 0) continue; // nothing worth emailing about

    const { subject, html, text } = reminderDigestEmail(user, groups, period);
    await sendMail({ to: user.email, subject, html, text });
    sent += 1;
  }

  console.log(`🔔 ${period} reminders processed — ${sent} email(s) sent.`);
  return sent;
};

/**
 * Send a digest to a single user on demand (used by the "remind me now"
 * endpoint for testing). Returns { sent, counts }.
 */
export const sendReminderForUser = async (user, period = "Manual") => {
  const tasks = await Task.find({ user: user._id, completed: false });
  const groups = groupTasks(tasks);
  const counts = {
    overdue: groups.overdue.length,
    today: groups.today.length,
    upcoming: groups.upcoming.length,
    noDate: groups.noDate.length,
  };
  const relevant = Object.values(counts).reduce((a, b) => a + b, 0);

  if (relevant === 0) return { sent: false, counts };

  const { subject, html, text } = reminderDigestEmail(user, groups, period);
  await sendMail({ to: user.email, subject, html, text });
  return { sent: true, counts };
};

/**
 * Schedule the twice-daily reminder jobs (08:00 and 20:00 by default).
 */
export const startReminderJobs = () => {
  if (String(process.env.ENABLE_REMINDERS) === "false") {
    console.log("🔔 Reminders are DISABLED (ENABLE_REMINDERS=false).");
    return;
  }

  const tz = process.env.REMINDER_TZ || "Asia/Kolkata";
  const morning = process.env.REMINDER_CRON_MORNING || "0 8 * * *";
  const evening = process.env.REMINDER_CRON_EVENING || "0 20 * * *";

  for (const [expr, period] of [
    [morning, "Morning"],
    [evening, "Evening"],
  ]) {
    if (!cron.validate(expr)) {
      console.error(`🔔 Invalid cron expression for ${period}: "${expr}" — skipped.`);
      continue;
    }
    cron.schedule(expr, () => sendReminders(period).catch(console.error), {
      timezone: tz,
    });
  }

  console.log(
    `🔔 Reminder jobs scheduled — Morning "${morning}", Evening "${evening}" (${tz}).`
  );
};
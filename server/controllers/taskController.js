import Task from "../models/Task.js";
import User from "../models/User.js";
import {
  XP_BY_PRIORITY,
  ONTIME_BONUS,
  levelFromXp,
  bumpStreak,
  evaluateAchievements,
} from "../utils/gamification.js";
import { sendMail, isMailConfigured } from "../utils/mailer.js";
import { scheduledTaskEmail } from "../utils/emailTemplates.js";
import { sendReminderForUser } from "../services/reminderService.js";
import { createNotification } from "./notificationController.js";

// Fire-and-forget confirmation email when a task gets scheduled.
const notifyScheduled = (user, task) => {
  const mail = scheduledTaskEmail(user, task);
  // Not awaited — email must never block or fail the request.
  sendMail({ to: user.email, ...mail });
};

/**
 * @desc    Get all tasks for the logged-in user (newest first)
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Task title is required");
    }

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      priority,
      category,
      dueDate: dueDate || null,
    });

    // Confirmation email when the task is scheduled on creation.
    if (task.dueDate) notifyScheduled(req.user, task);

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * Award XP / streak / achievements the first time a task is completed.
 * Mutates and persists the user, marks the task as rewarded, and returns a
 * `reward` summary for the client to celebrate (or null if nothing awarded).
 */
const grantReward = async (user, task) => {
  const prevLevel = levelFromXp(user.xp);

  // Base XP by priority + on-time bonus if completed by the due date.
  let xpGained = XP_BY_PRIORITY[task.priority] ?? XP_BY_PRIORITY.medium;
  let onTime = false;
  if (task.dueDate && new Date() <= new Date(task.dueDate).setHours(23, 59, 59, 999)) {
    xpGained += ONTIME_BONUS;
    onTime = true;
  }

  user.xp += xpGained;
  user.completedCount += 1;

  // Per-subject tally (Map).
  const cat = task.category || "General";
  user.completedByCategory.set(cat, (user.completedByCategory.get(cat) || 0) + 1);

  // Streak.
  user.streak = bumpStreak(user.streak);

  // Achievements — build a plain stats object for the evaluator.
  const stats = {
    xp: user.xp,
    completedCount: user.completedCount,
    streak: user.streak,
    completedByCategory: Object.fromEntries(user.completedByCategory),
  };
  const unlocked = evaluateAchievements(stats, user.achievements);
  if (unlocked.length) user.achievements.push(...unlocked);

  task.rewarded = true;
  await user.save();

  const level = levelFromXp(user.xp);

  // In-app notifications for milestones (fire-and-forget).
  if (level > prevLevel) {
    createNotification(user._id, {
      title: `Level up! You reached level ${level} 🎉`,
      body: "Your consistency is paying off. Keep grinding!",
      type: "achievement",
      link: "/progress",
    });
  }
  unlocked.forEach((key) =>
    createNotification(user._id, {
      title: "Achievement unlocked! 🏆",
      body: `You earned a new badge: ${key.replace(/_/g, " ")}.`,
      type: "achievement",
      link: "/progress",
    })
  );
  return {
    xpGained,
    onTime,
    onTimeBonus: onTime ? ONTIME_BONUS : 0,
    totalXp: user.xp,
    level,
    prevLevel,
    leveledUp: level > prevLevel,
    streak: { current: user.streak.current, longest: user.streak.longest },
    completedCount: user.completedCount,
    unlocked,
  };
};

/**
 * @desc    Update an existing task (and award rewards on first completion)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    if (task.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this task");
    }

    const { title, description, priority, category, dueDate, completed } =
      req.body;

    const wasCompleted = task.completed;
    const hadDueDate = Boolean(task.dueDate);

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (completed !== undefined) task.completed = completed;

    // Stamp / clear the completion time so "done today" views work.
    if (!wasCompleted && task.completed) task.completedAt = new Date();
    else if (wasCompleted && !task.completed) task.completedAt = null;

    // Award only on the first false -> true transition.
    let reward = null;
    if (!wasCompleted && task.completed && !task.rewarded) {
      const user = await User.findById(req.user._id);
      reward = await grantReward(user, task);
    }

    const updated = await task.save();

    // If a due date was just added to a still-pending task, confirm it.
    if (!hadDueDate && updated.dueDate && !updated.completed) {
      notifyScheduled(req.user, updated);
    }

    res.json({ task: updated, reward });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send the pending-task reminder digest to the current user now
 * @route   POST /api/tasks/remind
 * @access  Private
 */
export const remindMe = async (req, res, next) => {
  try {
    const result = await sendReminderForUser(req.user, "Manual");
    res.json({
      mailConfigured: isMailConfigured,
      ...result,
      message: !isMailConfigured
        ? "Email is not configured — the digest was logged to the server console instead."
        : result.sent
        ? `Reminder sent to ${req.user.email}`
        : "No pending tasks to remind you about.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete all tasks for the logged-in user
 * @route   DELETE /api/tasks
 * @access  Private
 */
export const deleteAllTasks = async (req, res, next) => {
  try {
    const { deletedCount } = await Task.deleteMany({ user: req.user._id });
    res.json({ deletedCount, message: "All tasks deleted" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    if (task.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this task");
    }

    await task.deleteOne();
    res.json({ id: req.params.id, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};
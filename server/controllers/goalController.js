import Goal from "../models/Goal.js";

// GET /api/goals
export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    next(error);
  }
};

// POST /api/goals
export const createGoal = async (req, res, next) => {
  try {
    const { title, type, period, target, unit, deadline } = req.body;
    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Goal title is required");
    }
    const goal = await Goal.create({
      user: req.user._id,
      title,
      type,
      period,
      target,
      unit,
      deadline: deadline || null,
    });
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

// PUT /api/goals/:id
export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }
    if (goal.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this goal");
    }

    const fields = ["title", "type", "period", "target", "progress", "unit", "deadline", "completed"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) goal[f] = req.body[f];
    });

    // Auto-complete when the target is reached.
    if (goal.progress >= goal.target) goal.completed = true;

    const updated = await goal.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/goals/:id
export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }
    if (goal.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this goal");
    }
    await goal.deleteOne();
    res.json({ id: req.params.id, message: "Goal deleted" });
  } catch (error) {
    next(error);
  }
};
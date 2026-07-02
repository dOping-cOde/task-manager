import Challenge from "../models/Challenge.js";

const CHALLENGE_LENGTH = 21;

// GET /api/challenges
export const getChallenges = async (req, res, next) => {
  try {
    const challenges = await Challenge.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(challenges);
  } catch (error) {
    next(error);
  }
};

// POST /api/challenges
export const createChallenge = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Challenge title is required");
    }
    const challenge = await Challenge.create({
      user: req.user._id,
      title,
      description,
    });
    res.status(201).json(challenge);
  } catch (error) {
    next(error);
  }
};

// PUT /api/challenges/:id
export const updateChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      res.status(404);
      throw new Error("Challenge not found");
    }
    if (challenge.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this challenge");
    }

    const { title, description, completedDays } = req.body;
    if (title !== undefined) challenge.title = title;
    if (description !== undefined) challenge.description = description;
    if (completedDays !== undefined) challenge.completedDays = completedDays;

    // Finished once all 21 days are ticked off.
    challenge.completed = challenge.completedDays.length >= CHALLENGE_LENGTH;

    const updated = await challenge.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/challenges/:id
export const deleteChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      res.status(404);
      throw new Error("Challenge not found");
    }
    if (challenge.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this challenge");
    }
    await challenge.deleteOne();
    res.json({ id: req.params.id, message: "Challenge deleted" });
  } catch (error) {
    next(error);
  }
};

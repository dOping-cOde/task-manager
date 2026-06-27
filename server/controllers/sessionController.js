import StudySession from "../models/StudySession.js";

/**
 * @desc    Get all study sessions for the logged-in user (newest first)
 * @route   GET /api/sessions
 * @access  Private
 */
export const getSessions = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit);

    let query = StudySession.find({ user: req.user._id }).sort({ date: -1 });
    if (Number.isFinite(limit) && limit > 0) query = query.limit(limit);

    const sessions = await query;
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new study session
 * @route   POST /api/sessions
 * @access  Private
 */
export const createSession = async (req, res, next) => {
  try {
    const { subject, durationMin, type, note, task } = req.body;

    if (!durationMin || Number(durationMin) <= 0) {
      res.status(400);
      throw new Error("Session duration must be greater than zero");
    }

    const session = await StudySession.create({
      user: req.user._id,
      subject,
      durationMin,
      type,
      note,
      task: task || null,
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a study session
 * @route   DELETE /api/sessions/:id
 * @access  Private
 */
export const deleteSession = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      res.status(404);
      throw new Error("Session not found");
    }

    if (session.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this session");
    }

    await session.deleteOne();
    res.json({ id: req.params.id, message: "Session deleted" });
  } catch (error) {
    next(error);
  }
};
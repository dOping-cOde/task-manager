import Syllabus from "../models/Syllabus.js";

// GET /api/syllabus
export const getSyllabus = async (req, res, next) => {
  try {
    const chapters = await Syllabus.find({ user: req.user._id }).sort({
      subject: 1,
      createdAt: 1,
    });
    res.json(chapters);
  } catch (error) {
    next(error);
  }
};

// POST /api/syllabus
export const createChapter = async (req, res, next) => {
  try {
    const { chapter, subject, note } = req.body;
    if (!chapter || !chapter.trim()) {
      res.status(400);
      throw new Error("Chapter is required");
    }
    const created = await Syllabus.create({
      user: req.user._id,
      chapter,
      subject,
      note,
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

// PUT /api/syllabus/:id
// Handles plain field edits and marking a chapter complete/incomplete (which
// also stamps completedAt so we can show when the syllabus was covered).
export const updateChapter = async (req, res, next) => {
  try {
    const item = await Syllabus.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error("Chapter not found");
    }
    if (item.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this chapter");
    }

    const { chapter, subject, note, completed } = req.body;

    if (chapter !== undefined) item.chapter = chapter;
    if (subject !== undefined) item.subject = subject;
    if (note !== undefined) item.note = note;
    if (completed !== undefined) {
      item.completed = completed;
      item.completedAt = completed ? new Date() : null;
    }

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/syllabus/:id
export const deleteChapter = async (req, res, next) => {
  try {
    const item = await Syllabus.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error("Chapter not found");
    }
    if (item.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this chapter");
    }
    await item.deleteOne();
    res.json({ id: req.params.id, message: "Chapter deleted" });
  } catch (error) {
    next(error);
  }
};

import Note from "../models/Note.js";

// GET /api/notes — pinned first, then most recently updated.
export const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({
      pinned: -1,
      updatedAt: -1,
    });
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

// POST /api/notes
export const createNote = async (req, res, next) => {
  try {
    const { title, content, subject, color, pinned } = req.body;
    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Note title is required");
    }
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      subject,
      color,
      pinned,
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

// PUT /api/notes/:id
export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      throw new Error("Note not found");
    }
    if (note.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this note");
    }
    ["title", "content", "subject", "color", "pinned"].forEach((f) => {
      if (req.body[f] !== undefined) note[f] = req.body[f];
    });
    const updated = await note.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      throw new Error("Note not found");
    }
    if (note.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this note");
    }
    await note.deleteOne();
    res.json({ id: req.params.id, message: "Note deleted" });
  } catch (error) {
    next(error);
  }
};
import Revision from "../models/Revision.js";

// Spaced-repetition gaps (in days) between successive revisions. After the Nth
// revision we schedule the next one this many days out; later revisions reuse
// the last (longest) gap.
const INTERVALS = [1, 3, 7, 16, 35, 60];

const nextRevisionDate = (count) => {
  const days = INTERVALS[Math.min(count - 1, INTERVALS.length - 1)] || 1;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

// GET /api/revisions
export const getRevisions = async (req, res, next) => {
  try {
    const revisions = await Revision.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(revisions);
  } catch (error) {
    next(error);
  }
};

// POST /api/revisions
export const createRevision = async (req, res, next) => {
  try {
    const { chapter, subject, note, priority } = req.body;
    if (!chapter || !chapter.trim()) {
      res.status(400);
      throw new Error("Chapter / topic is required");
    }
    const revision = await Revision.create({
      user: req.user._id,
      chapter,
      subject,
      note,
      priority,
    });
    res.status(201).json(revision);
  } catch (error) {
    next(error);
  }
};

// PUT /api/revisions/:id
// Supports plain field edits, a manual count set, and a `logRevision` action
// that bumps the count + reschedules the next revision.
export const updateRevision = async (req, res, next) => {
  try {
    const revision = await Revision.findById(req.params.id);
    if (!revision) {
      res.status(404);
      throw new Error("Revision not found");
    }
    if (revision.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this revision");
    }

    const { chapter, subject, note, priority, done, revisionCount, logRevision } =
      req.body;

    if (chapter !== undefined) revision.chapter = chapter;
    if (subject !== undefined) revision.subject = subject;
    if (note !== undefined) revision.note = note;
    if (priority !== undefined) revision.priority = priority;
    if (done !== undefined) revision.done = done;

    if (logRevision) {
      // Logged a fresh revision: bump the count and schedule the next one.
      revision.revisionCount += 1;
      revision.lastRevisedAt = new Date();
      revision.nextRevisionAt = nextRevisionDate(revision.revisionCount);
      revision.done = false; // revising it again un-masters it
    } else if (revisionCount !== undefined) {
      // Manual correction of the count; keep the schedule sensible.
      revision.revisionCount = Math.max(0, revisionCount);
      if (revision.revisionCount === 0) {
        revision.lastRevisedAt = null;
        revision.nextRevisionAt = null;
      }
    }

    const updated = await revision.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/revisions/:id
export const deleteRevision = async (req, res, next) => {
  try {
    const revision = await Revision.findById(req.params.id);
    if (!revision) {
      res.status(404);
      throw new Error("Revision not found");
    }
    if (revision.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this revision");
    }
    await revision.deleteOne();
    res.json({ id: req.params.id, message: "Revision deleted" });
  } catch (error) {
    next(error);
  }
};

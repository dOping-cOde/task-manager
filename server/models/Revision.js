import mongoose from "mongoose";

// A single chapter/topic the user wants to revise, tracked subject-wise. Each
// time it's revised the count bumps and a spaced-repetition "next revision"
// date is scheduled, so important things resurface before they're forgotten.
const revisionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      enum: [
        "Quantitative Aptitude",
        "Reasoning",
        "English",
        "General Awareness",
        "General",
      ],
      default: "General",
    },
    chapter: {
      type: String,
      required: [true, "Chapter / topic is required"],
      trim: true,
      maxlength: [200, "Chapter cannot exceed 200 characters"],
    },
    note: { type: String, default: "", trim: true, maxlength: 1000 },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    revisionCount: { type: Number, default: 0, min: 0 },
    lastRevisedAt: { type: Date, default: null },
    // When this chapter is next due for revision (spaced repetition).
    nextRevisionAt: { type: Date, default: null },
    // Marked done = mastered; drops out of the "due" queue.
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Revision = mongoose.model("Revision", revisionSchema);
export default Revision;

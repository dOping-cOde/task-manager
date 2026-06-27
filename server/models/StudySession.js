import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // CGL subject this session belongs to.
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
    // Optional link to a task the session was spent on.
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    durationMin: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["focus", "short", "long"],
      default: "focus",
    },
    note: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const StudySession = mongoose.model("StudySession", studySessionSchema);

export default StudySession;
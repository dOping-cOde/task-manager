import mongoose from "mongoose";

// A single syllabus chapter/topic tracked subject-wise. The user lists every
// chapter of the four exam subjects and marks each done as they finish it, so
// the app can report how much of the syllabus (overall and per subject) is
// complete.
const syllabusSchema = new mongoose.Schema(
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
      required: [true, "Chapter is required"],
      trim: true,
      maxlength: [200, "Chapter cannot exceed 200 characters"],
    },
    note: { type: String, default: "", trim: true, maxlength: 1000 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Syllabus = mongoose.model("Syllabus", syllabusSchema);
export default Syllabus;

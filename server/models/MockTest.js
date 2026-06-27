import mongoose from "mongoose";

// One scored section of a mock test (per CGL subject).
const sectionSchema = new mongoose.Schema(
  {
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
    score: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
  },
  { _id: false }
);

const mockTestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Mock test name is required"],
      trim: true,
    },
    provider: {
      type: String,
      default: "",
    },
    // Optional URL to the mock test (to revisit / re-attempt it).
    link: {
      type: String,
      default: "",
      trim: true,
    },
    // "full" = full-length mock; "sectional" = a single-section mock.
    type: {
      type: String,
      enum: ["full", "sectional"],
      default: "full",
    },
    // For sectional mocks: which section this score is for.
    subject: {
      type: String,
      enum: [
        "",
        "Quantitative Aptitude",
        "Reasoning",
        "English",
        "General Awareness",
        "General",
      ],
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: 0,
    },
    maxScore: {
      type: Number,
      default: 200,
      min: 1,
    },
    durationMin: {
      type: Number,
      default: 60,
    },
    sections: {
      type: [sectionSchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const MockTest = mongoose.model("MockTest", mockTestSchema);

export default MockTest;
import mongoose from "mongoose";

// Tracks which days of a calendar year a user has "cut" (crossed off).
// One document per user per year. `markedDays` holds 0-based day-of-year
// indices (0 = Jan 1). There are at most 366 of them, so a plain array is fine.
const yearTrackerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    year: { type: Number, required: true },
    markedDays: {
      type: [Number],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? [...new Set(arr.filter((n) => Number.isInteger(n) && n >= 0 && n < 366))]
          : [],
    },
  },
  { timestamps: true }
);

// One tracker per user per year.
yearTrackerSchema.index({ user: 1, year: 1 }, { unique: true });

const YearTracker = mongoose.model("YearTracker", yearTrackerSchema);
export default YearTracker;

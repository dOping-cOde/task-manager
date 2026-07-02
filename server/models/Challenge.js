import mongoose from "mongoose";

// A 21-day habit challenge. The user marks each of the 21 days as done; when all
// 21 are complete the challenge is finished. `completedDays` holds the 0-based
// indices (0..20) of the days that have been ticked off.
const challengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
    },
    description: { type: String, default: "", trim: true },
    completedDays: {
      type: [Number],
      default: [],
      // Keep only valid, unique day indices in range.
      set: (arr) =>
        Array.isArray(arr)
          ? [...new Set(arr.filter((n) => Number.isInteger(n) && n >= 0 && n < 21))]
          : [],
    },
    // How many tries it has taken so far. Starts at 1; every reset (a failed
    // run) bumps it, so the user can see how many attempts the 21 days took.
    attempts: { type: Number, default: 1, min: 1 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Challenge = mongoose.model("Challenge", challengeSchema);
export default Challenge;

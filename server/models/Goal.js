import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: [true, "Goal title is required"], trim: true },
    type: {
      type: String,
      enum: ["tasks", "study_hours", "mock_tests", "custom"],
      default: "custom",
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
    target: { type: Number, default: 1, min: 1 },
    progress: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "" },
    deadline: { type: Date, default: null },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    // CGL subject this task belongs to.
    category: {
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
    // Optional scheduled day for the calendar.
    dueDate: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    // When the task was last marked done. Powers "done today" views; cleared
    // when the task is un-completed.
    completedAt: {
      type: Date,
      default: null,
    },
    // Set once XP has been awarded for this task, to prevent re-farming XP
    // by toggling completion on and off.
    rewarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
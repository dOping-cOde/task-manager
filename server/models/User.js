import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password by default
    },

    // --- Profile ---
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, default: "" }, // URL or data-URI
    bio: { type: String, default: "", maxlength: 300 },
    targetExam: { type: String, default: "SSC CGL" },

    // --- Preferences / settings ---
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      dailyGoalHours: { type: Number, default: 4, min: 0, max: 24 },
      dailyGoalTasks: { type: Number, default: 5, min: 0, max: 100 },
      pomodoro: {
        focusMin: { type: Number, default: 25 },
        shortBreakMin: { type: Number, default: 5 },
        longBreakMin: { type: Number, default: 15 },
        roundsBeforeLongBreak: { type: Number, default: 4 },
      },
      emailReminders: { type: Boolean, default: true },
      motivationPopups: { type: Boolean, default: true },
    },

    // --- Gamification state ---
    xp: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
    // Per-subject completion counts, e.g. { "Reasoning": 4 }
    completedByCategory: {
      type: Map,
      of: Number,
      default: {},
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastDate: { type: String, default: null }, // YYYY-MM-DD
    },
    achievements: { type: [String], default: [] },

    // --- AI usage (daily rate limit) ---
    aiUsageDate: { type: String, default: "" }, // YYYY-MM-DD of last AI use
    aiUsageCount: { type: Number, default: 0 }, // AI requests used that day
  },
  { timestamps: true }
);

// Hash the password before saving whenever it has been modified.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare a plain password with the stored hash.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
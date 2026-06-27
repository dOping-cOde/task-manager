import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { createNotification } from "./notificationController.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please provide name, email and password");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error("An account with that email already exists");
    }

    const user = await User.create({ name, email, password });

    // Welcome notification (fire-and-forget, never blocks signup).
    createNotification(user._id, {
      title: "Welcome to CGLTracker! 🎯",
      body: "Add your first study task, schedule it, and start earning XP. Let's crack CGL.",
      type: "success",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      preferences: user.preferences,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate a user and return a token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide email and password");
    }

    // password has select:false, so explicitly request it here
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      preferences: user.preferences,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the currently logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  res.json(req.user);
};
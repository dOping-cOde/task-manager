import User from "../models/User.js";

/**
 * @desc    Get the logged-in user's profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
  try {
    // req.user is already the user document without the password.
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update the logged-in user's profile fields
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { name, bio, avatar, targetExam, examDate } = req.body;

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (targetExam !== undefined) user.targetExam = targetExam;
    if (examDate !== undefined) user.examDate = examDate || null;

    const updated = await user.save();

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload / replace the user's avatar (multipart field "avatar")
 * @route   POST /api/users/avatar
 * @access  Private
 *
 * Multer (avatarUpload) has already validated the type and the 1 MB size cap.
 * We persist the image as a base64 data URI on the user document.
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No image uploaded");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const base64 = req.file.buffer.toString("base64");
    user.avatar = `data:${req.file.mimetype};base64,${base64}`;
    const updated = await user.save();

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove the user's avatar
 * @route   DELETE /api/users/avatar
 * @access  Private
 */
export const removeAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    user.avatar = "";
    const updated = await user.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update the logged-in user's preferences (partial deep-merge)
 * @route   PUT /api/users/preferences
 * @access  Private
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { preferences } = req.body;
    const incoming = preferences || {};

    // Deep-merge into existing preferences so partial updates don't wipe siblings.
    const current = user.preferences || {};
    user.preferences = {
      ...current.toObject?.() ?? current,
      ...incoming,
      pomodoro: {
        ...(current.pomodoro?.toObject?.() ?? current.pomodoro ?? {}),
        ...(incoming.pomodoro || {}),
      },
    };

    user.markModified("preferences");
    const updated = await user.save();

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change the logged-in user's password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // password has select:false, so explicitly request it here.
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }

    // Assigning triggers the pre-save hook which hashes the password.
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (error) {
    next(error);
  }
};
import express from "express";
import {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  uploadAvatar,
  removeAvatar,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { avatarUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All user routes require authentication.
router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/avatar", avatarUpload, uploadAvatar);
router.delete("/avatar", removeAvatar);
router.put("/preferences", updatePreferences);
router.put("/password", changePassword);

export default router;
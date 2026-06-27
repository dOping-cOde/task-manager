import express from "express";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All notification routes require authentication.
router.use(protect);

router.get("/", getNotifications);
// "/read-all" must be declared before "/:id/read" so it isn't captured as an id.
router.put("/read-all", markAllRead);
router.put("/:id/read", markRead);
router.delete("/:id", deleteNotification);

export default router;
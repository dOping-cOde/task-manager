import express from "express";
import {
  getYearTracker,
  updateYearTracker,
} from "../controllers/yearTrackerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/:year").get(getYearTracker).put(updateYearTracker);

export default router;

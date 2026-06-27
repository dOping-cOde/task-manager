import express from "express";
import {
  generateStudyPlan,
  savePlanAsTasks,
  solveDoubt,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAI } from "../utils/aiProvider.js";

const router = express.Router();

// All AI routes require auth and a configured API key.
router.use(protect, requireAI);

router.post("/plan", generateStudyPlan);
router.post("/plan/save", savePlanAsTasks);
router.post("/doubt", solveDoubt);

export default router;

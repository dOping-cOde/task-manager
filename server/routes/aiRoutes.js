import express from "express";
import {
  generateStudyPlan,
  savePlanAsTasks,
  solveDoubt,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAI } from "../utils/aiProvider.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";

const router = express.Router();

// All AI routes require auth and a configured API key.
router.use(protect, requireAI);

// The two AI-generating endpoints are rate limited; saving tasks is not.
router.post("/plan", aiRateLimit, generateStudyPlan);
router.post("/plan/save", savePlanAsTasks);
router.post("/doubt", aiRateLimit, solveDoubt);

export default router;

import express from "express";
import {
  getMockTests,
  createMockTest,
  updateMockTest,
  deleteMockTest,
} from "../controllers/mockTestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All mock-test routes require authentication.
router.use(protect);

router.route("/").get(getMockTests).post(createMockTest);
router.route("/:id").put(updateMockTest).delete(deleteMockTest);

export default router;
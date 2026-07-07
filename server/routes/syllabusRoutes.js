import express from "express";
import {
  getSyllabus,
  createChapter,
  updateChapter,
  deleteChapter,
} from "../controllers/syllabusController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getSyllabus).post(createChapter);
router.route("/:id").put(updateChapter).delete(deleteChapter);

export default router;

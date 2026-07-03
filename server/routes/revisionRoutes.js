import express from "express";
import {
  getRevisions,
  createRevision,
  updateRevision,
  deleteRevision,
} from "../controllers/revisionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getRevisions).post(createRevision);
router.route("/:id").put(updateRevision).delete(deleteRevision);

export default router;

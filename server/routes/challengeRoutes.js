import express from "express";
import {
  getChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} from "../controllers/challengeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getChallenges).post(createChallenge);
router.route("/:id").put(updateChallenge).delete(deleteChallenge);

export default router;

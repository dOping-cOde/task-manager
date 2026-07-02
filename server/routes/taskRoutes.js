import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteAllTasks,
  remindMe,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All task routes require authentication.
router.use(protect);

router.post("/remind", remindMe);
router.route("/").get(getTasks).post(createTask).delete(deleteAllTasks);
router.route("/:id").put(updateTask).delete(deleteTask);

export default router;
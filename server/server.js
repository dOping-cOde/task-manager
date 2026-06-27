// Load environment variables BEFORE any other import. ES module imports are
// evaluated before the module body, so modules that read process.env at load
// time (e.g. the mailer) would otherwise see undefined values.
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import mockTestRoutes from "./routes/mockTestRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { verifyMailer } from "./utils/mailer.js";
import { startReminderJobs } from "./services/reminderService.js";

const app = express();

// Trust the first proxy (needed for correct client IPs behind a host/CDN,
// which keeps rate limiting accurate in production).
app.set("trust proxy", 1);

// --- Security & performance middleware ---
app.use(helmet());
app.use(compression());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
// Raised from 1mb so the AI Doubt Solver can accept screenshot uploads
// (images are compressed client-side, but this gives comfortable headroom).
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(cookieParser());
app.use(mongoSanitize()); // strip $ / . operators to block NoSQL injection
app.use(hpp()); // protect against HTTP parameter pollution

// Global rate limit, with a stricter limit on auth to slow brute-force.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  })
);
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many auth attempts, please try again later." },
  })
);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CGLTracker API is running 🚀" });
});

// --- API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

// --- Serve the built React app in production (single-service deploy) ---
// Express serves the API under /api and the static frontend for everything
// else, so there's no CORS and no separate frontend host needed.
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  // SPA fallback: any non-API route returns index.html so client routing works.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to the database FIRST, then start accepting requests. This avoids
// the confusing situation where the server is "up" but every query times out
// because MongoDB isn't actually reachable.
const start = async () => {
  await connectDB();
  await verifyMailer();
  startReminderJobs();
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
};

start();
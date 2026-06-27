import { streamChat, generateJSON } from "../utils/aiProvider.js";
import Task from "../models/Task.js";

const CATEGORIES = [
  "Quantitative Aptitude",
  "Reasoning",
  "English",
  "General Awareness",
  "General",
];

/**
 * @desc    Generate a personalised, day-by-day SSC CGL study plan
 * @route   POST /api/ai/plan
 * @access  Private
 */
export const generateStudyPlan = async (req, res, next) => {
  try {
    const {
      examName = "SSC CGL",
      durationDays = 14,
      hoursPerDay = 4,
      level = "intermediate",
      weakAreas = [],
      focusSubjects = [],
    } = req.body;

    const days = Math.min(Math.max(Number(durationDays) || 14, 1), 90);

    const system =
      "You are an expert SSC CGL coach who builds realistic, motivating, day-by-day study plans. " +
      "Cover the four CGL subjects (Quantitative Aptitude, Reasoning, English, General Awareness) " +
      "and build in revision and mock-test days. Each task must be concrete and actionable " +
      "(e.g. 'Practice 30 Time & Work questions'), sized to fit the daily hours.\n\n" +
      "Respond with ONLY valid JSON (no markdown, no code fences) matching exactly this shape:\n" +
      `{"examName": string, "summary": string, "days": [{"day": number, "focus": string, ` +
      `"tasks": [{"title": string, "category": string, "priority": "low"|"medium"|"high", ` +
      `"estimatedMinutes": number}]}]}\n` +
      `"category" MUST be one of: ${CATEGORIES.map((c) => `"${c}"`).join(", ")}.`;

    const prompt = [
      `Create a ${days}-day study plan for ${examName}.`,
      `Candidate level: ${level}.`,
      `Available study time: about ${hoursPerDay} hours per day.`,
      weakAreas.length ? `Weak areas to prioritise: ${weakAreas.join(", ")}.` : "",
      focusSubjects.length ? `Subjects to emphasise: ${focusSubjects.join(", ")}.` : "",
      `Return one entry per day, day 1 through ${days}.`,
    ]
      .filter(Boolean)
      .join("\n");

    const plan = await generateJSON({ system, prompt });

    if (!plan || !Array.isArray(plan.days)) {
      return res.status(502).json({ message: "AI returned an unexpected plan. Please retry." });
    }

    // Defensively normalise the model output so the client always gets clean data.
    plan.examName = plan.examName || examName;
    plan.summary = plan.summary || "";
    plan.days = plan.days.map((d, i) => ({
      day: Number(d.day) || i + 1,
      focus: d.focus || "Study",
      tasks: Array.isArray(d.tasks)
        ? d.tasks
            .filter((t) => t && t.title)
            .map((t) => ({
              title: String(t.title).slice(0, 200),
              category: CATEGORIES.includes(t.category) ? t.category : "General",
              priority: ["low", "medium", "high"].includes(t.priority) ? t.priority : "medium",
              estimatedMinutes: Number(t.estimatedMinutes) || 30,
            }))
        : [],
    }));

    res.json(plan);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Persist selected plan items as real tasks for the user
 * @route   POST /api/ai/plan/save
 * @access  Private
 *
 * Body: { tasks: [{ title, category, priority, dueDate }] }
 */
export const savePlanAsTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: "No tasks to save." });
    }
    if (tasks.length > 500) {
      return res.status(400).json({ message: "Too many tasks (max 500)." });
    }

    const docs = tasks
      .filter((t) => t && typeof t.title === "string" && t.title.trim())
      .map((t) => ({
        user: req.user._id,
        title: t.title.trim().slice(0, 200),
        category: CATEGORIES.includes(t.category) ? t.category : "General",
        priority: ["low", "medium", "high"].includes(t.priority) ? t.priority : "medium",
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      }));

    if (docs.length === 0) {
      return res.status(400).json({ message: "No valid tasks to save." });
    }

    const created = await Task.insertMany(docs);
    res.status(201).json({ count: created.length, tasks: created });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Streaming AI doubt solver (tutor chat)
 * @route   POST /api/ai/doubt
 * @access  Private
 *
 * Body: { messages: [{ role, content, images?: [dataURL] }], subject? }
 * Each message may carry one or more image data-URLs (screenshots of a
 * question). Streams the assistant's answer back as plain-text chunks.
 */

// "data:image/png;base64,XXXX" -> { mimeType, data } (or null if not an image)
const parseImage = (dataUrl) => {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  // ~7MB of base64 ≈ ~5MB image — reject anything larger to protect the server.
  if (m[2].length > 7_000_000) return null;
  return { type: "image", mimeType: m[1], data: m[2] };
};

export const solveDoubt = async (req, res, next) => {
  try {
    const { messages, subject } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages array is required." });
    }

    const history = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          (m.content || (Array.isArray(m.images) && m.images.length))
      )
      .slice(-12) // images are heavy — keep the recent window tighter
      .map((m) => {
        const text = String(m.content || "").slice(0, 8000);
        const images = Array.isArray(m.images)
          ? m.images.slice(0, 4).map(parseImage).filter(Boolean)
          : [];
        if (images.length === 0) return { role: m.role, content: text };
        return {
          role: m.role,
          content: [{ type: "text", text: text || "Solve this question." }, ...images],
        };
      });

    if (history.length === 0 || history[history.length - 1].role !== "user") {
      return res.status(400).json({ message: "Last message must be from the user." });
    }

    const system =
      "You are a patient, encouraging tutor for SSC CGL aspirants" +
      (subject ? ` specialising in ${subject}` : "") +
      ". Explain concepts step by step, show the working for quantitative and reasoning " +
      "problems, and finish with the final answer clearly marked. If the student attaches an " +
      "image (a screenshot of a question), read the question carefully from the image — including " +
      "any options — and solve it. Use simple Markdown (headings, bold, lists) and plain-text " +
      "math (use / for division and ^ for powers) — do NOT use LaTeX or $ delimiters. " +
      "Be concise but complete.";

    // Stop generating (and free the upstream connection) if the client leaves.
    const controller = new AbortController();
    req.on("close", () => controller.abort());

    // Lazily set headers on the first token so that a pre-stream failure can
    // still return a clean JSON error with the right status code.
    let started = false;
    const onText = (delta) => {
      if (!started) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("X-Accel-Buffering", "no");
        started = true;
      }
      res.write(delta);
    };

    try {
      await streamChat({ system, messages: history, onText, signal: controller.signal });
      if (!started) {
        return res.status(502).json({ message: "AI service returned no answer. Please retry." });
      }
      res.end();
    } catch (err) {
      if (err.name === "AbortError") {
        return res.end();
      }
      if (started) {
        res.write("\n\n_(The AI service hit an error. Please try again.)_");
        return res.end();
      }
      return res.status(502).json({ message: "AI service is unavailable right now. Please retry." });
    }
  } catch (error) {
    next(error);
  }
};

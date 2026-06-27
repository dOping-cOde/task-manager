# CGLTracker — MERN Study Tracker for SSC CGL

A full-stack, gamified study tracker built with the **MERN** stack (MongoDB, Express, React, Node) — purpose-built for **SSC CGL** prep. Features JWT auth, task CRUD with subject scheduling, a calendar, an XP/level/streak reward system, **Redux Toolkit** state, and a polished **Tailwind CSS** UI.

![stack](https://img.shields.io/badge/stack-MERN-4f46e5) ![redux](https://img.shields.io/badge/state-Redux_Toolkit-764abc) ![tailwind](https://img.shields.io/badge/ui-Tailwind_CSS-06b6d4)

## ✨ Features

- 🔐 **Authentication** — sign up & log in with JWT + bcrypt-hashed passwords
- ✅ **Task CRUD** — add, edit, delete, and list tasks (scoped per user)
- 📚 **CGL subjects** — tag tasks by Quant / Reasoning / English / General Awareness / General, with per-subject progress bars
- 📅 **Calendar** — month view; schedule tasks on days and plan study sessions
- ✉️ **Email notifications** — confirmation email when a task is scheduled, plus a **twice-daily** (8 AM / 8 PM) digest of overdue, due-today, and upcoming pending tasks. Includes a "Remind me now" button.
- 🎮 **Gamification & rewards** — earn **XP** per task (by priority), **on-time bonus**, **levels**, daily **streaks**, and unlockable **achievements**
- 🎉 **Celebrations** — confetti, XP toasts, and level-up animations on completion
- 🛡️ **Anti-farming** — each task awards XP only once, even if toggled
- 🎯 **Priorities** — low / medium / high labels
- 🔎 **Filter & search** — status tabs, subject chips, and title search
- 📊 **Progress dashboard** — level/XP bar, streak, completion rate, achievements grid
- ⚛️ **Redux Toolkit** — async thunks + slices for every domain
- 🎨 **Outstanding UI** — sidebar app shell, **dark mode**, modal editors, animations
- 🛡️ **Protected routes** — both client-side and API-side guards

### 🏢 Enterprise platform modules

- ⏱️ **Study Timer (Pomodoro)** — focus/break cycles, per-subject time tracking, daily focus totals
- 📝 **Mock Test tracker** — log tests, section-wise scores, and trend/accuracy **charts** (Recharts)
- 🎯 **Goals** — daily/weekly/monthly targets with progress bars and auto-completion
- 🗒️ **Notes** — colored, pinnable revision notes by subject with search
- 📈 **Analytics dashboard** — study-time, task-completion, and mock-score trends
- 🔔 **Notifications center** — in-app feed (welcome, achievements, level-ups) with unread badge
- 👤 **Profile & Settings** — edit profile, theme, study goals, Pomodoro durations, change password
- 🌗 **Dark mode** — light / dark / system, persisted
- 🔐 **Hardened API** — Helmet, rate limiting, NoSQL-injection sanitization, HPP protection, compression, request logging, role field (user/admin)

## 📁 Project Structure

```
todo-app/
├── server/                 # Express + MongoDB API
│   ├── config/db.js        # MongoDB connection
│   ├── models/             # User & Task Mongoose schemas
│   ├── controllers/        # Auth & task business logic
│   ├── routes/             # /api/auth & /api/tasks
│   ├── middleware/         # JWT protect + error handlers
│   ├── utils/              # JWT generation
│   └── server.js           # App entry point
│
└── client/                 # React + Vite frontend
    ├── src/
    │   ├── api/axios.js     # Axios instance + interceptors
    │   ├── app/store.js     # Redux store
    │   ├── features/        # auth & tasks slices (Redux Toolkit)
    │   ├── components/      # Navbar, TaskItem, TaskModal, etc.
    │   ├── pages/           # Login, Signup, Dashboard
    │   └── App.jsx          # Routing
    └── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally **or** a MongoDB Atlas connection string

### 1. Backend setup

```bash
cd server
npm install
cp .env.example .env      # then edit values as needed (Windows: copy .env.example .env)
npm run dev               # starts on http://localhost:5000
```

Environment variables (`server/.env`):

| Variable         | Description                              | Default                                 |
| ---------------- | ---------------------------------------- | --------------------------------------- |
| `PORT`           | API port                                 | `5000`                                  |
| `MONGO_URI`      | MongoDB connection string                | `mongodb://127.0.0.1:27017/mern_todo`   |
| `JWT_SECRET`     | Secret for signing JWTs (**change it!**) | —                                       |
| `JWT_EXPIRES_IN` | Token lifetime                           | `7d`                                    |
| `CLIENT_URL`     | Allowed CORS origin                      | `http://localhost:5173`                 |

### 2. Frontend setup

In a **second terminal**:

```bash
cd client
npm install
npm run dev               # starts on http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend at port `5000`, so no extra config is needed.

### 3. Open the app

Visit **http://localhost:5173**, create an account, and start adding tasks. 🎉

## 🔌 API Reference

| Method   | Endpoint           | Auth | Description                                  |
| -------- | ------------------ | ---- | -------------------------------------------- |
| `POST`   | `/api/auth/signup` | ❌   | Register a new user                          |
| `POST`   | `/api/auth/login`  | ❌   | Log in, returns token                        |
| `GET`    | `/api/auth/me`     | ✅   | Current user profile                         |
| `GET`    | `/api/tasks`       | ✅   | List user's tasks                            |
| `POST`   | `/api/tasks`       | ✅   | Create a task (title, category, priority, dueDate) |
| `PUT`    | `/api/tasks/:id`   | ✅   | Update a task; returns `{ task, reward }`    |
| `DELETE` | `/api/tasks/:id`   | ✅   | Delete a task                                |
| `POST`   | `/api/tasks/remind`| ✅   | Email the current user their pending-task digest now |
| `GET`    | `/api/stats`       | ✅   | Gamification stats (xp, level, streak, achievements) |
| `GET/POST/DELETE` | `/api/sessions` | ✅ | Study sessions (Pomodoro time tracking)       |
| `GET/POST/PUT/DELETE` | `/api/mock-tests` | ✅ | Mock test records                          |
| `GET/POST/PUT/DELETE` | `/api/goals` | ✅ | Study goals / targets                            |
| `GET/POST/PUT/DELETE` | `/api/notes` | ✅ | Revision notes                                   |
| `GET/PUT/DELETE` | `/api/notifications` | ✅ | Notification feed (+ read / read-all)         |
| `GET`    | `/api/analytics/overview` | ✅ | Aggregated study/task/mock analytics          |
| `GET/PUT` | `/api/users/profile` `/preferences` `/password` | ✅ | Profile, settings, password |

Authenticated requests must include `Authorization: Bearer <token>`.

### Reward system

- **XP per task:** low `10` · medium `20` · high `30`, plus a `+10` **on-time bonus** when completed on or before the due date.
- **Levels:** triangular XP curve — L1 `0`, L2 `100`, L3 `300`, L4 `600`, L5 `1000`…
- **Streaks:** consecutive days with at least one completed task (resets if a day is missed).
- **Achievements:** task milestones (1/10/50/100), streak milestones (3/7/30), level milestones (5/10), and an all-subjects "All-Rounder".
- Completing a task only awards XP **once** (tracked via a `rewarded` flag) to prevent farming.

## ✉️ Email & Reminders

Email is **optional** — without SMTP credentials the app runs fine and logs what it *would* send. To enable real emails, fill these in `server/.env`:

| Variable                | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `SMTP_HOST`             | SMTP server host (e.g. `smtp.sendgrid.net`)        |
| `SMTP_PORT`             | `587` (STARTTLS) or `465` (SSL)                    |
| `SMTP_SECURE`           | `true` for port 465, else `false`                  |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials                                 |
| `MAIL_FROM`             | From address, e.g. `"CGLTracker <no-reply@x.com>"` |
| `ENABLE_REMINDERS`      | `true` to run the cron jobs                        |
| `REMINDER_TZ`           | Cron timezone (default `Asia/Kolkata`)             |
| `REMINDER_CRON_MORNING` / `REMINDER_CRON_EVENING` | Digest times (default `0 8 * * *` / `0 20 * * *`) |
| `APP_URL`               | URL used in email buttons                          |

**When emails are sent:**
- **Scheduled** — when a task is created with a due date (or a due date is added later).
- **Twice-daily digest** — at the two cron times, every user with relevant pending tasks gets a summary (overdue / due today / upcoming / no date).
- **On demand** — the "Remind me" button (or `POST /api/tasks/remind`) sends your digest immediately.

> Tip: with any provider, generate a dedicated API key / app password rather than using your main account password.

## 🛠️ Tech Stack

**Backend:** Express · Mongoose · JWT · bcryptjs · CORS
**Frontend:** React 18 · Vite · Redux Toolkit · React Router · Axios · Tailwind CSS · react-hot-toast · react-icons

## 📝 License

MIT — free to use and modify.
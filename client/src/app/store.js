import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import tasksReducer from "../features/tasks/tasksSlice";
import gamificationReducer from "../features/gamification/gamificationSlice";
import uiReducer from "../features/ui/uiSlice";
import sessionsReducer from "../features/sessions/sessionsSlice";
import mockTestsReducer from "../features/mockTests/mockTestsSlice";
import goalsReducer from "../features/goals/goalsSlice";
import challengesReducer from "../features/challenges/challengesSlice";
import yearTrackerReducer from "../features/yearTracker/yearTrackerSlice";
import notesReducer from "../features/notes/notesSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import userReducer from "../features/user/userSlice";
import analyticsReducer from "../features/analytics/analyticsSlice";
import aiReducer from "../features/ai/aiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    gamification: gamificationReducer,
    ui: uiReducer,
    sessions: sessionsReducer,
    mockTests: mockTestsReducer,
    goals: goalsReducer,
    challenges: challengesReducer,
    yearTracker: yearTrackerReducer,
    notes: notesReducer,
    notifications: notificationsReducer,
    user: userReducer,
    analytics: analyticsReducer,
    ai: aiReducer,
  },
});
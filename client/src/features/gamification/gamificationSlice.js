import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { updateTask } from "../tasks/tasksSlice";

const initialState = {
  xp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForLevelSpan: 100,
  progressPct: 0,
  streak: { current: 0, longest: 0 },
  achievements: [],
  completedCount: 0,
  completedByCategory: {},
  status: "idle",
  // Transient: the most recent reward, consumed by RewardWatcher for confetti.
  lastReward: null,
};

export const fetchStats = createAsyncThunk(
  "gamification/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/stats");
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not load stats"
      );
    }
  }
);

const gamificationSlice = createSlice({
  name: "gamification",
  initialState,
  reducers: {
    clearReward: (state) => {
      state.lastReward = null;
    },
    resetGamification: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = "succeeded";
      })
      // When a task completion grants a reward, apply it optimistically and
      // stash it so the UI can celebrate. fetchStats is re-run afterward for
      // an authoritative refresh.
      .addCase(updateTask.fulfilled, (state, action) => {
        const reward = action.payload?.reward;
        if (!reward) return;
        state.xp = reward.totalXp;
        state.level = reward.level;
        state.streak = reward.streak;
        state.completedCount = reward.completedCount;
        if (reward.unlocked?.length) {
          state.achievements = [...state.achievements, ...reward.unlocked];
        }
        state.lastReward = reward;
      });
  },
});

export const { clearReward, resetGamification } = gamificationSlice.actions;
export default gamificationSlice.reducer;
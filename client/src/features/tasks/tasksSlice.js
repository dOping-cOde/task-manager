import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  // Transient: set when a task flips to completed, consumed by RewardWatcher
  // to fire confetti + a "great job" message (independent of XP rewards).
  justCompleted: null,
};

const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/tasks");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const addTask = createAsyncThunk(
  "tasks/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/tasks", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteAllTasks = createAsyncThunk(
  "tasks/deleteAll",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete("/tasks");
      return true;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// Trigger the pending-task reminder digest to the user's email on demand.
export const remindMe = createAsyncThunk(
  "tasks/remind",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/tasks/remind");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.justCompleted = null;
    },
    clearJustCompleted: (state) => {
      state.justCompleted = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add
      .addCase(addTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update — response is { task, reward }; reward is handled in the
      // gamification slice, here we just sync the task itself.
      .addCase(updateTask.fulfilled, (state, action) => {
        const task = action.payload.task;
        const index = state.items.findIndex((t) => t._id === task._id);
        const wasCompleted = index !== -1 ? state.items[index].completed : false;
        if (index !== -1) state.items[index] = task;
        // Celebrate only on a genuine not-done -> done transition (so editing a
        // completed task or un-completing one doesn't trigger confetti).
        if (!wasCompleted && task.completed) {
          state.justCompleted = { id: task._id, at: Date.now() };
        }
      })
      // Delete
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      })
      // Delete all
      .addCase(deleteAllTasks.fulfilled, (state) => {
        state.items = [];
        state.justCompleted = null;
      });
  },
});

export const { clearTasks, clearJustCompleted } = tasksSlice.actions;
export default tasksSlice.reducer;
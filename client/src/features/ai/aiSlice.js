import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  plan: null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  saving: false,
};

const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const generatePlan = createAsyncThunk(
  "ai/generatePlan",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/ai/plan", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const savePlanTasks = createAsyncThunk(
  "ai/savePlanTasks",
  async (tasks, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/ai/plan/save", { tasks });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    clearPlan: (state) => {
      state.plan = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generatePlan.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.plan = null;
      })
      .addCase(generatePlan.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.plan = action.payload;
      })
      .addCase(generatePlan.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(savePlanTasks.pending, (state) => {
        state.saving = true;
      })
      .addCase(savePlanTasks.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(savePlanTasks.rejected, (state) => {
        state.saving = false;
      });
  },
});

export const { clearPlan } = aiSlice.actions;
export default aiSlice.reducer;

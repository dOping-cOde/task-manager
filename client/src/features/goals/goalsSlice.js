import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = { items: [], status: "idle", error: null };
const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchGoals = createAsyncThunk("goals/fetch", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/goals");
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const addGoal = createAsyncThunk("goals/add", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/goals", payload);
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const updateGoal = createAsyncThunk(
  "goals/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/goals/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteGoal = createAsyncThunk("goals/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/goals/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    clearGoals: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        const i = state.items.findIndex((g) => g._id === action.payload._id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g._id !== action.payload);
      });
  },
});

export const { clearGoals } = goalsSlice.actions;
export default goalsSlice.reducer;
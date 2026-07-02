import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = { items: [], status: "idle", error: null };
const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchChallenges = createAsyncThunk(
  "challenges/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/challenges");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const addChallenge = createAsyncThunk(
  "challenges/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/challenges", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateChallenge = createAsyncThunk(
  "challenges/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/challenges/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteChallenge = createAsyncThunk(
  "challenges/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/challenges/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const challengesSlice = createSlice({
  name: "challenges",
  initialState,
  reducers: {
    clearChallenges: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChallenges.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchChallenges.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchChallenges.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addChallenge.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateChallenge.fulfilled, (state, action) => {
        const i = state.items.findIndex((c) => c._id === action.payload._id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteChallenge.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearChallenges } = challengesSlice.actions;
export default challengesSlice.reducer;

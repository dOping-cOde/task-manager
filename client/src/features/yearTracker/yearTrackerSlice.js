import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = { year: null, markedDays: [], status: "idle", error: null };
const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchYearTracker = createAsyncThunk(
  "yearTracker/fetch",
  async (year, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/year-tracker/${year}`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const saveYearTracker = createAsyncThunk(
  "yearTracker/save",
  async ({ year, markedDays }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/year-tracker/${year}`, { markedDays });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const yearTrackerSlice = createSlice({
  name: "yearTracker",
  initialState,
  reducers: {
    // Optimistic local toggle; the thunk persists the result.
    setMarkedDays: (state, action) => {
      state.markedDays = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchYearTracker.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchYearTracker.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.year = action.payload.year;
        state.markedDays = action.payload.markedDays;
      })
      .addCase(fetchYearTracker.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(saveYearTracker.fulfilled, (state, action) => {
        state.year = action.payload.year;
        state.markedDays = action.payload.markedDays;
      });
  },
});

export const { setMarkedDays } = yearTrackerSlice.actions;
export default yearTrackerSlice.reducer;

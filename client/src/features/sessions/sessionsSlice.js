import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchSessions = createAsyncThunk(
  "sessions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/sessions");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const addSession = createAsyncThunk(
  "sessions/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/sessions", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteSession = createAsyncThunk(
  "sessions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/sessions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    clearSessions: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSessions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add — newest first.
      .addCase(addSession.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Delete
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s._id !== action.payload);
      });
  },
});

export const { clearSessions } = sessionsSlice.actions;
export default sessionsSlice.reducer;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = { items: [], status: "idle", error: null };
const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchRevisions = createAsyncThunk(
  "revisions/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/revisions");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const addRevision = createAsyncThunk(
  "revisions/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/revisions", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateRevision = createAsyncThunk(
  "revisions/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/revisions/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteRevision = createAsyncThunk(
  "revisions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/revisions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const revisionsSlice = createSlice({
  name: "revisions",
  initialState,
  reducers: {
    clearRevisions: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevisions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRevisions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchRevisions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addRevision.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateRevision.fulfilled, (state, action) => {
        const i = state.items.findIndex((r) => r._id === action.payload._id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteRevision.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r._id !== action.payload);
      });
  },
});

export const { clearRevisions } = revisionsSlice.actions;
export default revisionsSlice.reducer;

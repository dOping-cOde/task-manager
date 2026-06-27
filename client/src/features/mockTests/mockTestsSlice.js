import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchMockTests = createAsyncThunk(
  "mockTests/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/mock-tests");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const addMockTest = createAsyncThunk(
  "mockTests/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/mock-tests", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateMockTest = createAsyncThunk(
  "mockTests/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/mock-tests/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteMockTest = createAsyncThunk(
  "mockTests/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/mock-tests/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const mockTestsSlice = createSlice({
  name: "mockTests",
  initialState,
  reducers: {
    clearMockTests: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchMockTests.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMockTests.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMockTests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add — keep list sorted by date ascending (matches server order).
      .addCase(addMockTest.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.items.sort((a, b) => new Date(a.date) - new Date(b.date));
      })
      // Update
      .addCase(updateMockTest.fulfilled, (state, action) => {
        const test = action.payload;
        const index = state.items.findIndex((t) => t._id === test._id);
        if (index !== -1) state.items[index] = test;
        state.items.sort((a, b) => new Date(a.date) - new Date(b.date));
      })
      // Delete
      .addCase(deleteMockTest.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      });
  },
});

export const { clearMockTests } = mockTestsSlice.actions;
export default mockTestsSlice.reducer;
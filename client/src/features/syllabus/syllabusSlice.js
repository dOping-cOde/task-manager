import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = { items: [], status: "idle", error: null };
const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchSyllabus = createAsyncThunk(
  "syllabus/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/syllabus");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const addChapter = createAsyncThunk(
  "syllabus/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/syllabus", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateChapter = createAsyncThunk(
  "syllabus/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/syllabus/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteChapter = createAsyncThunk(
  "syllabus/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/syllabus/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const syllabusSlice = createSlice({
  name: "syllabus",
  initialState,
  reducers: {
    clearSyllabus: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSyllabus.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSyllabus.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchSyllabus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addChapter.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateChapter.fulfilled, (state, action) => {
        const i = state.items.findIndex((c) => c._id === action.payload._id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteChapter.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearSyllabus } = syllabusSlice.actions;
export default syllabusSlice.reducer;

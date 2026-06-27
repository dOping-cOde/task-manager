import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = { items: [], status: "idle", error: null };
const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchNotes = createAsyncThunk("notes/fetch", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/notes");
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const addNote = createAsyncThunk("notes/add", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/notes", payload);
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const updateNote = createAsyncThunk(
  "notes/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/notes/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteNote = createAsyncThunk("notes/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/notes/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

// Keep pinned notes first, then newest updated — mirrors the server sort.
const sortNotes = (items) =>
  items.sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      new Date(b.updatedAt) - new Date(a.updatedAt)
  );

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearNotes: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addNote.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        sortNotes(state.items);
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        const i = state.items.findIndex((n) => n._id === action.payload._id);
        if (i !== -1) state.items[i] = action.payload;
        sortNotes(state.items);
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n._id !== action.payload);
      });
  },
});

export const { clearNotes } = notesSlice.actions;
export default notesSlice.reducer;
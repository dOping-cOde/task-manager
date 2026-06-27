import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  profile: null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const fetchProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/users/profile");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/users/profile", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updatePreferences = createAsyncThunk(
  "user/updatePreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/users/preferences", { preferences });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/users/password", payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "user/uploadAvatar",
  async (file, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await api.post("/users/avatar", fd);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const removeAvatar = createAsyncThunk(
  "user/removeAvatar",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/users/avatar");
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      // Update preferences
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      // Avatar upload / removal
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(removeAvatar.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { clearProfile } = userSlice.actions;
export default userSlice.reducer;
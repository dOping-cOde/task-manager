import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import {
  updateProfile,
  updatePreferences,
  uploadAvatar,
  removeAvatar,
} from "../user/userSlice";

// Hydrate initial state from localStorage so a refresh keeps the user logged in.
const storedUser = JSON.parse(localStorage.getItem("user")) || null;

const initialState = {
  user: storedUser,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const extractError = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const signup = createAsyncThunk(
  "auth/signup",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/signup", payload);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", payload);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("user");
      state.user = null;
      state.status = "idle";
      state.error = null;
    },
    // Merge partial updates into the current user (e.g. after a profile edit)
    // and keep localStorage in sync so the change survives a refresh.
    updateUser: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // Keep the auth user (the copy Layout/Settings read and the one persisted
    // to localStorage) in sync whenever the profile slice updates the user on
    // the server. Without this, changes like toggling motivation popups update
    // only state.user.profile and never reach the components gating on auth.
    const syncUser = (state, action) => {
      if (!state.user) return;
      // The profile responses omit the JWT, so spread to preserve the token.
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    };
    builder
      .addCase(updateProfile.fulfilled, syncUser)
      .addCase(updatePreferences.fulfilled, syncUser)
      .addCase(uploadAvatar.fulfilled, syncUser)
      .addCase(removeAvatar.fulfilled, syncUser);
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
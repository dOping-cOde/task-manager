import { createSlice } from "@reduxjs/toolkit";

// Theme is one of: "light" | "dark" | "system".
const storedTheme = localStorage.getItem("theme") || "system";
const storedCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

const initialState = {
  theme: storedTheme,
  sidebarCollapsed: storedCollapsed,
  mobileSidebarOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleTheme: (state) => {
      // Cycle light -> dark -> light (system collapses into this toggle).
      const next = state.theme === "dark" ? "light" : "dark";
      state.theme = next;
      localStorage.setItem("theme", next);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem("sidebarCollapsed", String(state.sidebarCollapsed));
    },
    setMobileSidebar: (state, action) => {
      state.mobileSidebarOpen = action.payload;
    },
  },
});

export const { setTheme, toggleTheme, toggleSidebar, setMobileSidebar } =
  uiSlice.actions;
export default uiSlice.reducer;
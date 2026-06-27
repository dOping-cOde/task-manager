import { useEffect } from "react";
import { useSelector } from "react-redux";

// Applies the resolved theme to <html> by toggling the `dark` class.
// Honors "system" via prefers-color-scheme and reacts to OS changes.
const ThemeManager = () => {
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark =
        theme === "dark" || (theme === "system" && mql.matches);
      root.classList.toggle("dark", isDark);
    };

    apply();
    if (theme === "system") {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
  }, [theme]);

  return null;
};

export default ThemeManager;
import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { MainLayout } from "./components/layout/MainLayout";
import { useWorkbenchStore } from "./store/workbenchStore";

function App() {
  const { theme } = useWorkbenchStore();

  // One-time migration: if persisted theme is still "dark" from before light was default,
  // reset it so first-time users see light theme.
  useEffect(() => {
    const stored = localStorage.getItem("workbench-store");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.theme === undefined) {
          useWorkbenchStore.getState().setTheme("light");
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const allThemes = ["dark", "light", "nord", "solarized", "midnight", "rose", "ocean", "sage", "lavender", "sand"];
    allThemes.forEach((t) => root.classList.remove(t));
    root.classList.add(theme);
    root.style.colorScheme = ["light", "solarized", "rose", "ocean", "sage", "lavender", "sand"].includes(theme) ? "light" : "dark";
  }, [theme]);

  return (
    <div className={theme}>
      <MainLayout />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontSize: "12px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "var(--bg)" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "var(--bg)" } },
        }}
      />
    </div>
  );
}

export default App;

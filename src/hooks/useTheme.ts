import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "protechos.theme";

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.toggle("dark", theme === "dark");
  html.classList.toggle("light", theme === "light");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null) as Theme | null;
    const initial: Theme = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(initial);
    apply(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    try { window.localStorage.setItem(KEY, next); } catch { /* ignore */ }
  };

  return { theme, toggle };
}

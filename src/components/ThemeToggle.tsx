"use client";

import { useEffect, useState } from "react";

import { MoonIcon, SunIcon } from "@/components/icons";

type Theme = "light" | "dark";

const storageKey = "hotel-demo-theme";

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

function preferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  /** Only animate after the user toggles — never on mount or route change. */
  const [animateIcons, setAnimateIcons] = useState(false);

  useEffect(() => {
    const next = readStoredTheme() ?? preferredTheme();
    setTheme(next);
    applyTheme(next);
    setReady(true);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setAnimateIcons(true);
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`hotel-btn hotel-btn-secondary gap-2 ${className}`}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      disabled={!ready}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <SunIcon
          className={`absolute h-5 w-5 ${
            animateIcons ? "transition-opacity duration-150 ease-out" : ""
          } ${theme === "dark" ? "opacity-100" : "opacity-0"}`}
        />
        <MoonIcon
          className={`absolute h-5 w-5 ${
            animateIcons ? "transition-opacity duration-150 ease-out" : ""
          } ${theme === "dark" ? "opacity-0" : "opacity-100"}`}
        />
      </span>
      <span className="inline-block min-w-[2.5rem] text-left">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}

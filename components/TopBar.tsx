"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons";

type Mode = "light" | "dark";

export function TopBar() {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    setMode(document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.setAttribute("data-mode", "dark");
    else document.documentElement.removeAttribute("data-mode");
    try {
      localStorage.setItem("keapr-mode", next);
    } catch {
      /* storage blocked: the choice just won't persist */
    }
    setMode(next);
  }

  return (
    <header className="top">
      <span className="portal">Keapr Training</span>
      <label className="search">
        <Icon name="search" />
        <input id="search" type="search" placeholder="Search lessons and resources" aria-label="Search lessons and resources" />
      </label>
      <button
        className="iconbtn modebtn"
        onClick={toggle}
        aria-pressed={mode === "dark"}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <Icon name="moon" className="sun" />
        <Icon name="sun" className="moon" />
      </button>
      <button className="iconbtn" aria-label="Help">
        <Icon name="help" />
      </button>
      <button className="iconbtn dot" aria-label="Notifications, 1 unread">
        <Icon name="bell" />
      </button>
    </header>
  );
}

"use client";

import { useEffect } from "react";

export default function ApplyThemeColor() {
  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      const parsed = user ? JSON.parse(user) : null;
      const color = parsed?.primaryColor || "#A03048";
      document.documentElement.style.setProperty("--primary-color", color);
    } catch {
      document.documentElement.style.setProperty("--primary-color", "#A03048");
    }
  }, []);

  return null;
}

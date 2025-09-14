// app/components/ThemeInitializer.tsx
"use client";

import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

export default function ThemeInitializer() {
  useSetPrimaryColor(); // runs once globally
  return null; // nothing visible, just sets up theme
}

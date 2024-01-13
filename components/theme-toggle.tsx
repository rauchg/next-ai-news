"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      className="p-0 h-auto text-inherit font-normal my-auto"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <span>{theme === "light" ? "[ Dark ]" : "[ Light ]"}</span>
    </Button>
  );
}

"use client";

import { useTheme } from "next-themes";
import { Check, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const colorThemes: { name: string; value: string; class: string }[] = [
  { name: "Zinc", value: "zinc", class: "bg-zinc-500" },
  { name: "Slate", value: "slate", class: "bg-slate-500" },
  { name: "Stone", value: "stone", class: "bg-stone-500" },
  { name: "Gray", value: "gray", class: "bg-gray-500" },
  { name: "Neutral", value: "neutral", class: "bg-neutral-500" },
  { name: "Red", value: "red", class: "bg-red-500" },
  { name: "Rose", value: "rose", class: "bg-rose-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-500" },
  { name: "Violet", value: "violet", class: "bg-violet-500" },
];

export function ThemeCustomizer({
  themeColor: propColor,
  onThemeChange,
  colorMode,
  onColorModeChange
}: {
  themeColor?: string;
  onThemeChange?: (color: string) => void;
  colorMode?: string;
  onColorModeChange?: (mode: string) => void;
} = {}) {
  const { theme, setTheme } = useTheme();
  const activeColor = propColor;

  const handleColorChange = (color: string) => {
    if (onThemeChange) {
      onThemeChange(color);
      // Instant Preview Hack: directly modify the <html> tag classes so the user
      // sees the new color instantly before hitting the Save API button.
      if (typeof window !== "undefined") {
        const html = document.documentElement;
        // Remove all theme-xxx classes
        const classes = Array.from(html.classList);
        classes.forEach(c => {
          if (c.startsWith('theme-')) {
            html.classList.remove(c);
          }
        });
        html.classList.add(`theme-${color}`);
      }
    }
  };

  const handleModeChange = (mode: string) => {
    // 1. Trigger NextThemes locally so the browser flips the color for preview
    setTheme(mode);
    // 2. Report it to the parent so it can be saved globally via settings API
    if (onColorModeChange) {
      onColorModeChange(mode);
    }
  };

  const activeMode = colorMode || theme;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the appearance of the app. Switch between day
          and night modes or use the system preference globally.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase text-muted-foreground">
            Color Theme
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
            {colorThemes.map((t) => (
              <Button
                key={t.value}
                variant="outline"
                className={`w-full justify-start gap-2 ${activeColor === t.value ? "border-primary border-2" : ""
                  }`}
                onClick={() => handleColorChange(t.value)}
              >
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${t.class}`}
                >
                  {activeColor === t.value && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="text-xs truncate">{t.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase text-muted-foreground">
            Mode
          </Label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleModeChange("light")}
              className={activeMode === "light" ? "border-primary border-2" : ""}
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleModeChange("dark")}
              className={activeMode === "dark" ? "border-primary border-2" : ""}
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleModeChange("system")}
              className={activeMode === "system" ? "border-primary border-2" : ""}
            >
              <Monitor className="mr-2 h-4 w-4" />
              System
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

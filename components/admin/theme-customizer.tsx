"use client";

import { Check, Monitor, Moon, Snowflake, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const PREVIOUS_THEME_STORAGE_KEY = "istanbulportrait_prev_theme_color";

const colorThemes: { name: string; value: string; class: string }[] = [
  { name: "Bronze", value: "bronze", class: "bg-amber-700" },
  { name: "Stone", value: "stone", class: "bg-stone-500" },
  { name: "Slate", value: "slate", class: "bg-slate-600" },
  { name: "Zinc", value: "zinc", class: "bg-zinc-600" },
  { name: "Gray", value: "gray", class: "bg-gray-600" },
  { name: "Neutral", value: "neutral", class: "bg-neutral-600" },
  { name: "Rose", value: "rose", class: "bg-rose-500" },
  { name: "Violet", value: "violet", class: "bg-violet-600" },
  { name: "Red", value: "red", class: "bg-red-700" },
  { name: "Orange", value: "orange", class: "bg-amber-600" },
  { name: "Green", value: "green", class: "bg-emerald-700" },
  { name: "Blue", value: "blue", class: "bg-sky-700" },
  { name: "Yellow", value: "yellow", class: "bg-amber-500" },
  {
    name: "Christmas",
    value: "christmas",
    class: "bg-gradient-to-br from-[#8b152a] via-[#9f1239] to-[#d4af37]",
  },
];

export function ThemeCustomizer({
  themeColor: propColor,
  onThemeChange,
  colorMode,
  onColorModeChange,
  onQuickThemeSave,
}: {
  themeColor?: string;
  onThemeChange?: (color: string) => void;
  colorMode?: string;
  onColorModeChange?: (mode: string) => void;
  onQuickThemeSave?: (color: string) => Promise<void> | void;
} = {}) {
  const { theme, setTheme } = useTheme();
  const [isTogglingSeason, setIsTogglingSeason] = useState(false);
  const activeColor = propColor || "bronze";
  const isChristmasActive = activeColor === "christmas";

  // Sync DOM on mount or when propColor updates from server/database
  useEffect(() => {
    if (activeColor && typeof window !== "undefined") {
      const html = document.documentElement;
      const classes = Array.from(html.classList);
      classes.forEach((c) => {
        if (c.startsWith("theme-")) {
          html.classList.remove(c);
        }
      });
      html.classList.add(`theme-${activeColor}`);
    }
  }, [activeColor]);

  const applyThemeClass = (color: string) => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      const classes = Array.from(html.classList);
      classes.forEach((c) => {
        if (c.startsWith("theme-")) {
          html.classList.remove(c);
        }
      });
      html.classList.add(`theme-${color}`);
    }
  };

  const handleColorChange = (color: string) => {
    if (
      typeof window !== "undefined" &&
      activeColor !== "christmas" &&
      color === "christmas"
    ) {
      localStorage.setItem(PREVIOUS_THEME_STORAGE_KEY, activeColor);
    }
    if (typeof window !== "undefined" && color !== "christmas") {
      localStorage.setItem(PREVIOUS_THEME_STORAGE_KEY, color);
    }

    // 1. Immediately modify the <html> tag classes so the user
    // sees the new color instantly across the entire application and settings page.
    applyThemeClass(color);

    // 2. Notify parent state so it's ready to be saved via PATCH /api/admin/settings
    if (onThemeChange) {
      onThemeChange(color);
    }
  };

  const handleChristmasSeasonSwitch = async (enabled: boolean) => {
    if (isTogglingSeason) return;

    let nextColor = "christmas";
    if (enabled) {
      if (typeof window !== "undefined" && activeColor !== "christmas") {
        localStorage.setItem(PREVIOUS_THEME_STORAGE_KEY, activeColor);
      }
    } else {
      const savedPrev =
        typeof window !== "undefined"
          ? localStorage.getItem(PREVIOUS_THEME_STORAGE_KEY)
          : null;
      nextColor = savedPrev && savedPrev !== "christmas" ? savedPrev : "bronze";
    }

    applyThemeClass(nextColor);
    if (onThemeChange) {
      onThemeChange(nextColor);
    }

    if (onQuickThemeSave) {
      setIsTogglingSeason(true);
      try {
        await onQuickThemeSave(nextColor);
      } finally {
        setIsTogglingSeason(false);
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
  const currentThemeObj =
    colorThemes.find((t) => t.value === activeColor) || colorThemes[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance & Color Theme</CardTitle>
        <CardDescription>
          Customize the global brand colors and theme mode. Switching colors
          immediately previews across buttons, badges, typography, and borders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* One-Click Seasonal Holiday Switch */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all ${
            isChristmasActive
              ? "border-[#d4af37]/50 bg-gradient-to-r from-[#8b152a]/10 via-[#d4af37]/10 to-[#133a2a]/10 shadow-sm"
              : "border-border bg-muted/20"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  isChristmasActive
                    ? "bg-gradient-to-br from-[#8b152a] to-[#133a2a] border-[#d4af37]/50 text-[#f3d37a] shadow-sm"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                <Snowflake className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Christmas Season Mode
                  </span>
                  <Badge
                    variant={isChristmasActive ? "default" : "secondary"}
                    className={
                      isChristmasActive
                        ? "bg-gradient-to-r from-[#8b152a] to-[#133a2a] text-[#fdf8ee] border border-[#d4af37]/50 text-[10px] tracking-wider"
                        : "text-[10px] tracking-wider"
                    }
                  >
                    {isChristmasActive ? "ACTIVE" : "OFF"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  One-click seasonal switch: activates the{" "}
                  <strong className="text-foreground">
                    Winter Velvet Luxury
                  </strong>{" "}
                  palette (Velvet Ruby, Champagne Gold & Pine), delicate snow &
                  gold bokeh particles on the storefront, and matching festive
                  email banners.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <Label
                htmlFor="christmas-season-switch"
                className="text-xs font-medium text-muted-foreground cursor-pointer"
              >
                {isChristmasActive ? "Enabled" : "Enable"}
              </Label>
              <Switch
                id="christmas-season-switch"
                checked={isChristmasActive}
                disabled={isTogglingSeason}
                onCheckedChange={handleChristmasSeasonSwitch}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Color Theme
            </Label>
            <span className="text-xs font-semibold text-primary">
              Active: {currentThemeObj.name}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
            {colorThemes.map((t) => (
              <Button
                key={t.value}
                type="button"
                variant="outline"
                className={`w-full justify-start gap-2 transition-all ${
                  activeColor === t.value
                    ? "border-primary ring-2 ring-primary/20 font-semibold"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleColorChange(t.value)}
              >
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 shadow-xs ${t.class}`}
                >
                  {activeColor === t.value && (
                    <Check className="h-3 w-3 text-white stroke-[2.5]" />
                  )}
                </div>
                <span className="text-xs truncate">{t.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Live Theme Preview Box */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-colors ${
            isChristmasActive
              ? "border-[#d4af37]/40 bg-gradient-to-br from-[#8b152a]/[0.06] via-primary/[0.04] to-[#133a2a]/[0.08]"
              : "border-primary/20 bg-primary/[0.03]"
          }`}
        >
          {isChristmasActive && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <span className="festive-bokeh absolute -top-4 right-12 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.22),transparent_70%)] blur-md" />
              <span className="festive-bokeh absolute bottom-0 left-16 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(139,21,42,0.16),transparent_70%)] blur-md" />
            </div>
          )}

          <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${currentThemeObj.class}`}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Live Preview: {currentThemeObj.name} Theme
              </span>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              {isChristmasActive ? "Seasonal Preview" : "Active Preview"}
            </Badge>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
            <div className="space-y-1">
              <h4 className="font-serif text-lg sm:text-xl font-normal text-primary">
                {currentThemeObj.name} Editorial Accent
              </h4>
              <p className="text-xs text-muted-foreground">
                {isChristmasActive
                  ? "Velvet Ruby, Champagne Gold & Pine accents with Hero gold bokeh and gentle snow."
                  : "Headings, buttons, badges, and focus rings will reflect this color."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-primary text-primary-foreground">
                Badge
              </Badge>
              <Button size="sm" type="button" className="shadow-xs">
                {isChristmasActive ? (
                  <Snowflake className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                )}
                Primary Button
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase text-muted-foreground">
            Mode
          </Label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleModeChange("light")}
              className={
                activeMode === "light"
                  ? "border-primary ring-2 ring-primary/20 font-semibold"
                  : ""
              }
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleModeChange("dark")}
              className={
                activeMode === "dark"
                  ? "border-primary ring-2 ring-primary/20 font-semibold"
                  : ""
              }
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleModeChange("system")}
              className={
                activeMode === "system"
                  ? "border-primary ring-2 ring-primary/20 font-semibold"
                  : ""
              }
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

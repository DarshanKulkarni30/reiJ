import React from "react";
import { useTheme } from "../context/ThemeContext";
import { ThemeName } from "../types";
import { Sparkles, Check, SunMedium, Palette } from "lucide-react";

interface ThemeSelectorControlProps {
  compact?: boolean;
  className?: string;
}

export const ThemeSelectorControl: React.FC<ThemeSelectorControlProps> = ({
  compact = false,
  className = "",
}) => {
  const { themeMode, activeTheme, setThemeMode, setManualTheme, themeConfig } = useTheme();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Toggle: Auto (Follows Today's Mood) vs Manual Palette */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--color-bg-subtle,#F4F6F2)] border border-[var(--color-border-subtle,#E5E9E1)]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
            <span className="text-xs font-semibold text-[var(--color-text-primary,#1E201E)]">
              Mood-Adaptive Theme (Auto)
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary,#5A605A)] leading-relaxed">
            Adapts palette to Today’s mood with an uplifting bias. Never gloomy.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#DCE0D8)] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setThemeMode("auto")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              themeMode === "auto"
                ? "bg-[var(--color-accent,#1C6E41)] text-white shadow-xs"
                : "text-[var(--color-text-secondary,#5A605A)] hover:text-[var(--color-text-primary,#1E201E)]"
            }`}
          >
            Auto Mode
          </button>
          <button
            type="button"
            onClick={() => setThemeMode("manual")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              themeMode === "manual"
                ? "bg-[var(--color-accent,#1C6E41)] text-white shadow-xs"
                : "text-[var(--color-text-secondary,#5A605A)] hover:text-[var(--color-text-primary,#1E201E)]"
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {/* Palette Selection Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary,#405746)] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>Select Palette</span>
          </span>
          {themeMode === "auto" && (
            <span className="text-[11px] text-[var(--color-text-muted,#7A807A)] italic">
              Picking a theme switches to Manual
            </span>
          )}
        </div>

        <div className={`grid ${compact ? "grid-cols-2 sm:grid-cols-3 gap-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"}`}>
          {themeConfig.map((theme) => {
            const isSelected = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setManualTheme(theme.id)}
                className={`group relative p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-[var(--color-accent,#1C6E41)] ring-2 ring-[var(--color-accent,#1C6E41)]/20 bg-[var(--color-bg-surface,#FFFFFF)] shadow-xs"
                    : "border-[var(--color-border,#DCE0D8)] hover:border-[var(--color-text-secondary,#8A9A8C)] bg-[var(--color-bg-surface,#FFFFFF)] hover:bg-[var(--color-bg-subtle,#F8FAF6)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-primary,#1E201E)]">
                    {theme.label}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[var(--color-accent,#1C6E41)] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Color Swatch Dots */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  {theme.previewColors.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {!compact && (
                  <p className="text-[11px] text-[var(--color-text-muted,#6B7280)] line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

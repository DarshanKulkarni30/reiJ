import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Mood, ThemeMode, ThemeName, UserProfile } from "../types";
import { saveUserProfile } from "../lib/storage";

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ThemeName;
  setThemeMode: (mode: ThemeMode) => void;
  setManualTheme: (theme: ThemeName) => void;
  reportMood: (mood: Mood) => void;
  isAuto: boolean;
  themeConfig: {
    id: ThemeName;
    label: string;
    description: string;
    previewColors: string[];
  }[];
}

const THEME_CONFIGS: {
  id: ThemeName;
  label: string;
  description: string;
  previewColors: string[];
}[] = [
  {
    id: "grove",
    label: "Grove",
    description: "Lush botanical emerald, sage linen, grounded organic growth.",
    previewColors: ["#F6FAF6", "#1C6E41", "#405746"],
  },
  {
    id: "serene",
    label: "Serene",
    description: "Tranquil celadon teal and eucalyptus mist, quiet stillness.",
    previewColors: ["#F4F8F7", "#0D9488", "#395550"],
  },
  {
    id: "harbor",
    label: "Harbor",
    description: "Pacific cyan and deep ocean navy, contemplative clarity.",
    previewColors: ["#F3F8FB", "#0284C7", "#375369"],
  },
  {
    id: "iris",
    label: "Iris",
    description: "Celestial violet-indigo and soft lavender mist, inquisitive depth.",
    previewColors: ["#F7F6FC", "#6366F1", "#4A4768"],
  },
  {
    id: "ember",
    label: "Ember",
    description: "Resolute terracotta copper and warm sandstone, focused determination.",
    previewColors: ["#FAF6F1", "#C2410C", "#6A4935"],
  },
  {
    id: "solis",
    label: "Solis",
    description: "Bright golden daylight and vibrant amber warmth, energized vitality.",
    previewColors: ["#FAF9F0", "#D97706", "#5C5535"],
  },
  {
    id: "dawn",
    label: "Dawn",
    description: "Soft rose-gold warmth, gentle morning uplift and quiet comfort.",
    previewColors: ["#FAF6F4", "#C8542B", "#634F44"],
  },
  {
    id: "nightbloom",
    label: "Night Bloom",
    description: "Deep velvet twilight sanctuary, luminous starlight periwinkle.",
    previewColors: ["#13151D", "#818CF8", "#A6AFCB"],
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Mapping from Mood to Theme under Auto mode with an uplifting bias
// Every mood has its own distinct, vibrant visual identity
export function getAutoThemeForMood(mood?: Mood | null): ThemeName {
  if (!mood) return "grove";

  switch (mood) {
    case "Determined":
      // Resolute terracotta copper & warm sandstone
      return "ember";

    case "Energized":
      // Bright radiant golden daylight & honey amber
      return "solis";

    case "Reflective":
      // Deep maritime ocean cyan & airy harbor blue
      return "harbor";

    case "Searching":
      // Inquisitive celestial iris & lavender-indigo mist
      return "iris";

    case "Grounded":
      // Forest botanical emerald & steady sage linen
      return "grove";

    case "Quiet":
      // Tranquil celadon teal & eucalyptus mist
      return "serene";

    case "Heavy":
      // Gentle rose-gold morning uplift, soft comfort
      return "dawn";

    default:
      return "grove";
  }
}

const STORAGE_KEY_MODE = "rei_theme_mode";
const STORAGE_KEY_THEME = "rei_theme_name";

export const ThemeProvider: React.FC<{
  userProfile?: UserProfile | null;
  children: React.ReactNode;
}> = ({ userProfile, children }) => {
  // Initialize from userProfile or localStorage, default to auto + grove
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (userProfile?.themeMode) return userProfile.themeMode;
    const stored = localStorage.getItem(STORAGE_KEY_MODE);
    return stored === "manual" ? "manual" : "auto";
  });

  const [activeTheme, setActiveThemeState] = useState<ThemeName>(() => {
    if (userProfile?.themePreference) return userProfile.themePreference as ThemeName;
    const stored = localStorage.getItem(STORAGE_KEY_THEME) as ThemeName;
    if (stored && THEME_CONFIGS.some((t) => t.id === stored)) return stored;
    return "grove";
  });

  const [lastReportedMood, setLastReportedMood] = useState<Mood | null>(null);

  // Apply theme class to <html> and <body>
  useEffect(() => {
    const root = document.documentElement;
    THEME_CONFIGS.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
      document.body.classList.remove(`theme-${t.id}`);
    });
    root.classList.add(`theme-${activeTheme}`);
    document.body.classList.add(`theme-${activeTheme}`);
  }, [activeTheme]);

  // Sync with userProfile when profile updates from Firestore
  useEffect(() => {
    if (userProfile?.themeMode) {
      setThemeModeState(userProfile.themeMode);
      if (userProfile.themeMode === "manual" && userProfile.themePreference) {
        setActiveThemeState(userProfile.themePreference as ThemeName);
      }
    }
  }, [userProfile?.themeMode, userProfile?.themePreference]);

  // When user switches mode
  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      setThemeModeState(mode);
      localStorage.setItem(STORAGE_KEY_MODE, mode);

      if (mode === "auto") {
        const autoTheme = getAutoThemeForMood(lastReportedMood);
        setActiveThemeState(autoTheme);
        localStorage.setItem(STORAGE_KEY_THEME, autoTheme);
      }

      if (userProfile?.uid) {
        try {
          await saveUserProfile({
            ...userProfile,
            themeMode: mode,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Failed to persist theme mode to profile:", err);
        }
      }
    },
    [lastReportedMood, userProfile]
  );

  // When user picks a manual theme
  const setManualTheme = useCallback(
    async (theme: ThemeName) => {
      setThemeModeState("manual");
      setActiveThemeState(theme);
      localStorage.setItem(STORAGE_KEY_MODE, "manual");
      localStorage.setItem(STORAGE_KEY_THEME, theme);

      if (userProfile?.uid) {
        try {
          await saveUserProfile({
            ...userProfile,
            themeMode: "manual",
            themePreference: theme,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Failed to persist manual theme to profile:", err);
        }
      }
    },
    [userProfile]
  );

  // When Today view reports a mood
  const reportMood = useCallback(
    (mood: Mood) => {
      setLastReportedMood(mood);
      if (themeMode === "auto") {
        const newTheme = getAutoThemeForMood(mood);
        setActiveThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY_THEME, newTheme);
      }
    },
    [themeMode]
  );

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        setThemeMode,
        setManualTheme,
        reportMood,
        isAuto: themeMode === "auto",
        themeConfig: THEME_CONFIGS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

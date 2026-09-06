import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ActiveTab } from "../types";
import { ReiLogo } from "./ReiLogo";
import {
  LogOut,
  User,
  Sparkles,
  Palette,
  Settings,
  ChevronDown,
  Check,
  Shield,
} from "lucide-react";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfileEdit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfileEdit,
}) => {
  const { currentUser, userProfile, signOut } = useAuth();
  const { themeMode, activeTheme, setThemeMode, setManualTheme, themeConfig, isAuto } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  const isAdmin = userProfile?.role === "admin";

  const primaryTabs: { id: ActiveTab; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "journal", label: "Journal" },
    { id: "journey", label: "Journey" },
    { id: "reflect", label: "Reflect" },
    { id: "patterns", label: "Patterns" },
    { id: "grow", label: "Grow" },
    { id: "model", label: "Your Model" },
    ...(isAdmin ? [{ id: "admin" as ActiveTab, label: "Admin" }] : []),
  ];

  const currentThemeObj = themeConfig.find((t) => t.id === activeTheme);

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg-canvas,#F6FAF6)]/90 backdrop-blur-md border-b border-[var(--color-border,#D4E3D7)] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Wordmark with vibrant Rei mark */}
        <div className="flex items-center gap-6">
          <ReiLogo
            size="md"
            showWordmark={true}
            onClick={() => setActiveTab("today")}
            className="cursor-pointer"
          />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? "bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)] shadow-xs"
                      : "text-[var(--color-text-secondary,#405746)] hover:text-[var(--color-text-primary,#152419)] hover:bg-[var(--color-bg-subtle,#ECF4EC)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right actions: Theme Switcher & User Profile Menu */}
        <div className="flex items-center gap-2.5">
          {/* Quick Theme Switcher Pill */}
          <div className="relative">
            <button
              id="header-theme-switcher-btn"
              onClick={() => {
                setThemePickerOpen(!themePickerOpen);
                setDropdownOpen(false);
              }}
              title={`Theme: ${isAuto ? "Auto" : currentThemeObj?.label}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] hover:bg-[var(--color-bg-subtle,#ECF4EC)] text-xs text-[var(--color-text-secondary,#405746)] transition-all shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
              <span className="hidden sm:inline font-medium text-[11px]">
                {isAuto ? "Auto" : currentThemeObj?.label}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/10"
                style={{ backgroundColor: currentThemeObj?.previewColors[1] || "#1C6E41" }}
              />
            </button>

            {/* Quick Theme Popover */}
            {themePickerOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[var(--color-bg-elevated,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-border-subtle,#E6EFE8)]">
                  <span className="font-semibold text-[var(--color-text-primary,#152419)]">Theme & Mood</span>
                  <button
                    onClick={() => setThemeMode(isAuto ? "manual" : "auto")}
                    className="text-[11px] font-medium text-[var(--color-accent,#1C6E41)] hover:underline"
                  >
                    {isAuto ? "Switch to Manual" : "Switch to Auto"}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setThemeMode("auto");
                      setThemePickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      isAuto
                        ? "bg-[var(--color-accent-subtle,#E3F2E8)] text-[var(--color-accent,#1C6E41)] font-medium"
                        : "hover:bg-[var(--color-bg-subtle,#ECF4EC)] text-[var(--color-text-primary,#152419)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto (Follows Today's Mood)</span>
                    </div>
                    {isAuto && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="pt-1 text-[10px] uppercase font-semibold tracking-wider text-[var(--color-text-muted,#677D6D)] px-1">
                    Named Palettes
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {themeConfig.map((t) => {
                      const selected = !isAuto && activeTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setManualTheme(t.id);
                            setThemePickerOpen(false);
                          }}
                          className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            selected
                              ? "border-[var(--color-accent,#1C6E41)] bg-[var(--color-accent-subtle,#E3F2E8)] text-[var(--color-accent,#1C6E41)] font-medium"
                              : "border-[var(--color-border-subtle,#E6EFE8)] hover:bg-[var(--color-bg-subtle,#ECF4EC)] text-[var(--color-text-primary,#152419)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{t.label}</span>
                            {selected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex items-center gap-1">
                            {t.previewColors.map((c, i) => (
                              <span
                                key={i}
                                className="w-2.5 h-2.5 rounded-full border border-black/10"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setThemePickerOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] hover:bg-[var(--color-bg-subtle,#ECF4EC)] text-xs text-[var(--color-text-primary,#152419)] transition-colors shadow-2xs"
            >
              <span className="font-medium max-w-[100px] truncate">
                {userProfile?.name || currentUser?.displayName || "You"}
              </span>
              <div className="w-6 h-6 rounded-full bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)] flex items-center justify-center text-xs font-semibold">
                {(userProfile?.name || currentUser?.displayName || "R")[0].toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted,#677D6D)]" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--color-bg-elevated,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xl p-2 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-[var(--color-border-subtle,#E6EFE8)]">
                  <p className="font-medium text-[var(--color-text-primary,#152419)]">
                    {userProfile?.name || "Reflective User"}
                  </p>
                  <p className="text-[var(--color-text-muted,#677D6D)] truncate text-[11px]">
                    {currentUser?.email || "Google Account"}
                  </p>
                  {userProfile?.personBecoming && (
                    <p className="mt-2 text-[11px] text-[var(--color-text-secondary,#405746)] italic bg-[var(--color-bg-subtle,#ECF4EC)] p-2 rounded-lg border border-[var(--color-border-subtle,#E6EFE8)]">
                      "{userProfile.personBecoming}"
                    </p>
                  )}
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    id="profile-edit-menu-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfileEdit();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--color-text-primary,#152419)] hover:bg-[var(--color-bg-subtle,#ECF4EC)]"
                  >
                    <Settings className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                    <span>Edit Profile & Evolution</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setActiveTab("model");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--color-text-primary,#152419)] hover:bg-[var(--color-bg-subtle,#ECF4EC)]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                    <span>View Your Model</span>
                  </button>

                  {isAdmin && (
                    <button
                      id="admin-dashboard-menu-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        setActiveTab("admin");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--color-accent,#1C6E41)] font-medium hover:bg-[var(--color-bg-subtle,#ECF4EC)]"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Metrics</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-[var(--color-border-subtle,#E6EFE8)]">
                  <button
                    id="sign-out-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#A8382F] hover:bg-[#FAF0EF]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Bar */}
      <div className="md:hidden flex items-center justify-start overflow-x-auto border-t border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-canvas,#F6FAF6)] py-2 px-3 gap-1 scrollbar-none">
        {primaryTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)]"
                  : "text-[var(--color-text-secondary,#405746)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

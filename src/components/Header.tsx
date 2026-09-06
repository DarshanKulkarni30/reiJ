import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ActiveTab } from "../types";
import {
  LogOut,
  User,
  Sparkles,
  BookOpen,
  Compass,
  GitCommit,
  Clock,
  Settings,
  ChevronDown,
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const primaryTabs: { id: ActiveTab; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "journal", label: "Journal" },
    { id: "journey", label: "Journey" },
    { id: "reflect", label: "Reflect" },
    { id: "patterns", label: "Patterns" },
    { id: "grow", label: "Grow" },
    { id: "model", label: "Your Model" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FBFBF9]/90 backdrop-blur-md border-b border-[#EAECE6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab("today")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#1E201E] flex items-center justify-center text-[#FBFBF9] font-serif text-base font-medium transition-transform group-hover:scale-105">
              R
            </div>
            <span className="font-serif text-2xl font-normal tracking-tight text-[#1E201E]">
              Rei
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? "bg-[#1E201E] text-[#FBFBF9] shadow-xs"
                      : "text-[#5A605A] hover:text-[#1E201E] hover:bg-[#EFEFEA]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Actions */}
        <div className="relative">
          <button
            id="user-profile-menu-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-[#DCE0D8] bg-white hover:bg-[#F2F4F0] text-xs text-[#383C38] transition-colors"
          >
            <span className="font-medium max-w-[110px] truncate">
              {userProfile?.name || currentUser?.displayName || "You"}
            </span>
            <div className="w-6 h-6 rounded-full bg-[#E5E8E2] text-[#2D3A2F] flex items-center justify-center text-xs font-semibold">
              {(userProfile?.name || currentUser?.displayName || "R")[0].toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#828882]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E0E3DD] shadow-xl p-2 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-[#F0F2ED]">
                <p className="font-medium text-[#1E201E]">{userProfile?.name || "Reflective User"}</p>
                <p className="text-[#7A807A] truncate text-[11px]">{currentUser?.email || "Google Account"}</p>
                {userProfile?.personBecoming && (
                  <p className="mt-2 text-[11px] text-[#4A504A] italic bg-[#F7F8F5] p-2 rounded-lg border border-[#EBEFE8]">
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
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#383C38] hover:bg-[#F5F7F3]"
                >
                  <Settings className="w-3.5 h-3.5 text-[#2D3A2F]" />
                  <span>Edit Profile & Evolution</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setActiveTab("model");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#383C38] hover:bg-[#F5F7F3]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2D3A2F]" />
                  <span>View Your Model</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[#F0F2ED]">
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

      {/* Mobile & Tablet Navigation Bar */}
      <div className="md:hidden flex items-center justify-start overflow-x-auto border-t border-[#EAECE6] bg-[#FBFBF9] py-2 px-3 gap-1 scrollbar-none">
        {primaryTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                active ? "bg-[#1E201E] text-[#FBFBF9]" : "text-[#606460]"
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

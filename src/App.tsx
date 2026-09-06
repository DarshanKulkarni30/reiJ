import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ActiveTab, JournalInteraction } from "./types";
import { LandingPage } from "./components/LandingPage";
import { OnboardingModal } from "./components/OnboardingModal";
import { Header } from "./components/Header";
import { TodayView } from "./components/TodayView";
import { JournalView } from "./components/JournalView";
import { JourneyView } from "./components/JourneyView";
import { ReflectView } from "./components/ReflectView";
import { PatternsView } from "./components/PatternsView";
import { GrowView } from "./components/GrowView";
import { YourModelView } from "./components/YourModelView";
import { AdminDashboardView } from "./components/AdminDashboardView";
import { EntryDetailModal } from "./components/EntryDetailModal";
import { ProfileEditModal } from "./components/ProfileEditModal";
import { ReiLogoMark } from "./components/ReiLogo";

const MainApp: React.FC = () => {
  const { currentUser, userProfile, loading, isOnboarded } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("today");
  const [selectedEntry, setSelectedEntry] = useState<JournalInteraction | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-canvas,#F6FAF6)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ReiLogoMark sizePx={44} className="animate-pulse" />
          <p className="font-serif text-sm text-[var(--color-text-secondary,#405746)]">
            Opening Rei...
          </p>
        </div>
      </div>
    );
  }

  // Not signed in -> Landing Page
  if (!currentUser) {
    return <LandingPage />;
  }

  // Signed in but incomplete onboarding -> Onboarding Modal
  if (!isOnboarded) {
    return <OnboardingModal />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas,#F6FAF6)] text-[var(--color-text-primary,#152419)] flex flex-col justify-between selection:bg-[var(--color-accent-subtle,#E3F2E8)] transition-colors duration-200">
      {/* Header & Nav */}
      <div>
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenProfileEdit={() => setIsProfileEditOpen(true)}
        />

        {/* Active Tab View */}
        <main className="pb-16">
          {activeTab === "today" && (
            <TodayView
              onEntrySaved={() => {
                // Keep on today or explore journey
              }}
              goToJournal={() => setActiveTab("journal")}
            />
          )}

          {activeTab === "journal" && (
            <JournalView
              onSelectEntry={(entry) => setSelectedEntry(entry)}
              onWriteNew={() => setActiveTab("today")}
            />
          )}

          {activeTab === "journey" && (
            <JourneyView
              onSelectEntry={(entry) => setSelectedEntry(entry)}
              onWriteNew={() => setActiveTab("today")}
            />
          )}

          {activeTab === "reflect" && <ReflectView />}

          {activeTab === "patterns" && <PatternsView />}

          {activeTab === "grow" && <GrowView />}

          {activeTab === "model" && <YourModelView />}

          {activeTab === "admin" && <AdminDashboardView />}
        </main>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdateEntry={(updated) => {
            setSelectedEntry(updated);
          }}
        />
      )}

      {/* Profile & Evolution Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
      />

      {/* Understated Disclaimer Footer */}
      <footer className="border-t border-[var(--color-border-subtle,#E6EFE8)] bg-[var(--color-bg-canvas,#F6FAF6)] py-6 px-6 text-center text-xs text-[var(--color-text-muted,#677D6D)] space-y-1">
        <p>Rei is a private reflection tool, not medical, mental-health, or financial advice.</p>
        <p className="text-[11px] text-[var(--color-text-muted,#677D6D)]/80">
          Built with care for the Cloud Run AI Challenge • Google Cloud & Firebase • Region: asia-southeast1
        </p>
      </footer>
    </div>
  );
};

const AppWithTheme: React.FC = () => {
  const { userProfile } = useAuth();
  return (
    <ThemeProvider userProfile={userProfile}>
      <MainApp />
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppWithTheme />
    </AuthProvider>
  );
}

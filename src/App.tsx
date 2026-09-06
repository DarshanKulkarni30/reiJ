import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ActiveTab, JournalInteraction } from "./types";
import { LandingPage } from "./components/LandingPage";
import { OnboardingModal } from "./components/OnboardingModal";
import { Header } from "./components/Header";
import { TodayView } from "./components/TodayView";
import { JournalView } from "./components/JournalView";
import { ReflectView } from "./components/ReflectView";
import { GrowView } from "./components/GrowView";
import { YourModelView } from "./components/YourModelView";
import { EntryDetailModal } from "./components/EntryDetailModal";

const MainApp: React.FC = () => {
  const { currentUser, userProfile, loading, isOnboarded } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("today");
  const [selectedEntry, setSelectedEntry] = useState<JournalInteraction | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1E201E] flex items-center justify-center text-[#FBFBF9] font-serif text-lg animate-pulse">
            R
          </div>
          <p className="font-serif text-sm text-[#7A807A]">Opening Rei...</p>
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
    <div className="min-h-screen bg-[#FBFBF9] text-[#1E201E] flex flex-col justify-between selection:bg-[#E3E8E3]">
      {/* Header & Nav */}
      <div>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Active Tab View */}
        <main className="pb-16">
          {activeTab === "today" && (
            <TodayView
              onEntrySaved={() => {
                // optionally switch to journal or keep on today
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

          {activeTab === "reflect" && <ReflectView />}

          {activeTab === "grow" && <GrowView />}

          {activeTab === "model" && <YourModelView />}
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

      {/* Understated Disclaimer Footer */}
      <footer className="border-t border-[#EAECE6] bg-[#FAFBF8] py-6 px-6 text-center text-xs text-[#7A807A] space-y-1">
        <p>Rei is a private reflection tool, not medical, mental-health, or financial advice.</p>
        <p className="text-[11px] text-[#9A9E9A]">
          Built with care for the Cloud Run AI Challenge • Google Cloud & Firebase
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

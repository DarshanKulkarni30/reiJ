import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Mood, JournalInteraction } from "../types";
import { saveJournalInteraction } from "../lib/storage";
import { Sparkles, Check, AlertCircle, RefreshCw, Feather, ArrowRight } from "lucide-react";

interface TodayViewProps {
  onEntrySaved?: (entry: JournalInteraction) => void;
  goToJournal?: () => void;
}

const MOOD_OPTIONS: { mood: Mood; label: string }[] = [
  { mood: "Grounded", label: "Grounded" },
  { mood: "Reflective", label: "Reflective" },
  { mood: "Energized", label: "Energized" },
  { mood: "Searching", label: "Searching" },
  { mood: "Heavy", label: "Heavy" },
  { mood: "Quiet", label: "Quiet" },
  { mood: "Determined", label: "Determined" },
];

export const TodayView: React.FC<TodayViewProps> = ({ onEntrySaved, goToJournal }) => {
  const { currentUser, userProfile } = useAuth();

  const todayDateStr = new Date().toISOString().split("T")[0];
  const formattedToday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [mood, setMood] = useState<Mood>("Grounded");
  const [intention, setIntention] = useState<string>("");
  const [promptQuestion, setPromptQuestion] = useState<string>("How do you want to show up today?");
  const [promptLoading, setPromptLoading] = useState<boolean>(false);
  const [freeWrite, setFreeWrite] = useState<string>("");
  const [eveningClose, setEveningClose] = useState<string>("");
  const [showEveningClose, setShowEveningClose] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<JournalInteraction | null>(null);

  // Fetch daily personalized prompt
  useEffect(() => {
    async function loadDailyPrompt() {
      if (!userProfile) return;
      setPromptLoading(true);
      try {
        const res = await fetch("/api/daily-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            traits: userProfile.desiredTraits,
            personBecoming: userProfile.personBecoming,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.prompt) {
            setPromptQuestion(data.prompt);
          }
        }
      } catch (e) {
        // Fallback default
        setPromptQuestion("How do you want to show up today?");
      } finally {
        setPromptLoading(false);
      }
    }
    loadDailyPrompt();
  }, [userProfile]);

  const handleSaveAndReflect = async () => {
    if (!currentUser || !userProfile) return;
    if (!freeWrite.trim()) {
      setSaveError("Please write a few thoughts before saving.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const entryId = `entry_${Date.now()}`;
    const now = new Date();

    try {
      // 1. Call server /api/reflect to get Gemini reflection & internal signals
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.uid,
        },
        body: JSON.stringify({
          text: freeWrite.trim(),
          mood,
          intention: intention.trim(),
          promptQuestion,
          eveningClose: eveningClose.trim() || undefined,
          traits: userProfile.desiredTraits,
          personBecoming: userProfile.personBecoming,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Reflection failed (${response.status})`);
      }

      const reflectData = await response.json();

      // 2. Form the complete interaction object
      const fullInteraction: JournalInteraction = {
        id: entryId,
        userId: currentUser.uid,
        date: todayDateStr,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mood,
        intention: intention.trim(),
        promptQuestion,
        freeWrite: freeWrite.trim(),
        eveningClose: eveningClose.trim() || undefined,

        // Rei internal signals
        emotion: reflectData.emotion,
        theme: reflectData.theme,
        behavior: reflectData.behavior,
        relatedTrait: reflectData.relatedTrait,
        intensity: reflectData.intensity,
        reflectionQuestion: reflectData.reflectionQuestion,
        growthSignal: reflectData.growthSignal,

        createdAt: now.toISOString(),
      };

      // 3. Persist to Firestore (and local cache)
      await saveJournalInteraction(currentUser.uid, fullInteraction);

      setSavedResult(fullInteraction);
      if (onEntrySaved) {
        onEntrySaved(fullInteraction);
      }
    } catch (err: any) {
      console.error("[Save Error]:", err);
      setSaveError(err.message || "Failed to save entry. Your draft is preserved below.");
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = freeWrite.trim() ? freeWrite.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Date & Subdued Greeting */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-[#7A807A] font-semibold">
          {formattedToday}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
          How do you want to show up today?
        </h1>
        <p className="text-sm text-[#5A605A] font-light">
          Bring whatever is true right now. Rei will reflect with you.
        </p>
      </div>

      {/* If newly saved, show Rei's reflection response */}
      {savedResult ? (
        <div className="p-8 rounded-2xl bg-[#F5F6F2] border border-[#DEE2DA] space-y-6 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#E3E7DE] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2D3A2F]"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#3D453E]">
                Something we've noticed
              </span>
            </div>
            <span className="text-xs text-[#7A807A]">Saved to your journal</span>
          </div>

          {/* Rei's Single Next Question */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-[#606460]">
              A question for you
            </p>
            <p className="font-serif text-xl sm:text-2xl text-[#1E201E] font-normal leading-snug">
              "{savedResult.reflectionQuestion}"
            </p>
          </div>

          {/* Grounded Growth Signal */}
          {savedResult.growthSignal && (
            <div className="p-4 rounded-xl bg-white border border-[#E0E4DC] text-sm text-[#383C38] leading-relaxed">
              <span className="font-semibold text-[#2D3A2F]">Your growth: </span>
              {savedResult.growthSignal}
            </div>
          )}

          {/* Internal Signals */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            {savedResult.emotion && (
              <span className="px-3 py-1 rounded-full bg-white border border-[#DCE0D8] text-[#383C38]">
                Tone: {savedResult.emotion}
              </span>
            )}
            {savedResult.relatedTrait && (
              <span className="px-3 py-1 rounded-full bg-[#E8EBE4] text-[#2D3A2F] font-medium">
                Trait: {savedResult.relatedTrait}
              </span>
            )}
            {savedResult.theme && (
              <span className="px-3 py-1 rounded-full bg-white border border-[#DCE0D8] text-[#555A55]">
                Theme: {savedResult.theme}
              </span>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#E3E7DE]">
            <button
              onClick={() => {
                setSavedResult(null);
                setFreeWrite("");
                setIntention("");
                setEveningClose("");
              }}
              className="text-xs text-[#525752] hover:text-[#1E201E] underline cursor-pointer"
            >
              Write another reflection
            </button>
            {goToJournal && (
              <button
                onClick={goToJournal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E201E] text-white text-xs font-medium hover:bg-[#2D3A2F] transition-all"
              >
                <span>View in Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* The Active Journaling Form */
        <div className="space-y-8">
          {/* Mood Check */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A605A]">
              Current State
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((item) => {
                const selected = mood === item.mood;
                return (
                  <button
                    key={item.mood}
                    type="button"
                    onClick={() => setMood(item.mood)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? "bg-[#2D3A2F] text-white border-[#2D3A2F]"
                        : "bg-white text-[#4A4E4A] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Intention */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A605A]">
              Today's Intention
            </label>
            <input
              id="today-intention-input"
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="What quality or commitment will you carry into today?"
              className="w-full px-4 py-3 rounded-xl border border-[#D8DBD2] bg-white text-sm focus:outline-none focus:border-[#2D3A2F]"
            />
          </div>

          {/* Today's Question for You */}
          <div className="p-4 rounded-xl bg-[#F4F5F1] border border-[#E3E6DF] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest text-[#727872] font-semibold">
                A question for you
              </span>
              {promptLoading && (
                <span className="text-[10px] text-[#888E88] animate-pulse">Personalizing...</span>
              )}
            </div>
            <p className="font-serif text-lg text-[#1E201E] font-normal leading-relaxed">
              "{promptQuestion}"
            </p>
          </div>

          {/* Free Write Journal Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A605A]">
                Journal
              </label>
              <span className="text-xs text-[#828882]">{wordCount} words</span>
            </div>
            <textarea
              id="today-freewrite-textarea"
              rows={8}
              value={freeWrite}
              onChange={(e) => setFreeWrite(e.target.value)}
              placeholder="Speak candidly about what happened, what you felt, or where you hesitated. Rei learns from your words..."
              className="w-full p-4 rounded-2xl border border-[#D8DBD2] bg-white text-base text-[#1E201E] leading-relaxed focus:outline-none focus:border-[#2D3A2F]"
            />
          </div>

          {/* Optional Evening Close Accordion */}
          <div className="border-t border-[#E8EAE4] pt-4">
            {!showEveningClose ? (
              <button
                type="button"
                onClick={() => setShowEveningClose(true)}
                className="text-xs text-[#5A605A] hover:text-[#1E201E] font-medium flex items-center gap-1.5"
              >
                <span>+ Add an optional evening close</span>
              </button>
            ) : (
              <div className="space-y-2 p-4 rounded-xl bg-white border border-[#E0E4DC]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5A605A]">
                    Evening Close
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEveningClose(false)}
                    className="text-[11px] text-[#888E88] hover:text-[#1E201E]"
                  >
                    Hide
                  </button>
                </div>
                <textarea
                  id="today-evening-close-textarea"
                  rows={3}
                  value={eveningClose}
                  onChange={(e) => setEveningClose(e.target.value)}
                  placeholder="Looking back on the day: What surprised you, tested your intentions, or shifted your view?"
                  className="w-full p-3 rounded-lg border border-[#D8DBD2] bg-[#FAFBF8] text-sm focus:outline-none focus:border-[#2D3A2F]"
                />
              </div>
            )}
          </div>

          {/* Error Notice with Retry Save */}
          {saveError && (
            <div className="p-4 rounded-xl bg-[#FAF0EF] border border-[#F0D5D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#A8382F]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
              <button
                id="retry-save-btn"
                type="button"
                onClick={handleSaveAndReflect}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-[#A8382F] text-white font-medium hover:bg-[#8F2E26] shrink-0"
              >
                Retry Save
              </button>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#888E88]">
              Saved securely to your private personal model
            </span>
            <button
              id="today-save-reflect-btn"
              type="button"
              onClick={handleSaveAndReflect}
              disabled={isSaving || !freeWrite.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] disabled:opacity-50 text-white text-sm font-medium transition-all shadow-xs"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reflecting...</span>
                </>
              ) : (
                <>
                  <Feather className="w-4 h-4" />
                  <span>Save & Reflect</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

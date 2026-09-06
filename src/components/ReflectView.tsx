import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalInteraction, WeeklyNote } from "../types";
import { getJournalInteractions, getWeeklyNotes, saveWeeklyNote } from "../lib/storage";
import { Sparkles, Calendar, ArrowRight, RefreshCw, Feather, CheckCircle } from "lucide-react";

export const ReflectView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [weeklyNotes, setWeeklyNotes] = useState<WeeklyNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [activeWeeklyNote, setActiveWeeklyNote] = useState<WeeklyNote | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [loadedEntries, loadedNotes] = await Promise.all([
          getJournalInteractions(currentUser.uid),
          getWeeklyNotes(currentUser.uid),
        ]);
        setEntries(loadedEntries);
        setWeeklyNotes(loadedNotes);
        if (loadedNotes.length > 0) {
          setActiveWeeklyNote(loadedNotes[0]);
        }
      } catch (err) {
        console.error("Failed to load reflection data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  // Extract recurring themes from user's entries
  const recurringThemesMap = entries.reduce((acc, curr) => {
    if (curr.theme) {
      acc[curr.theme] = (acc[curr.theme] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topThemes = Object.entries(recurringThemesMap)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 5);

  // Latest reflection question
  const latestEntryWithQuestion = entries.find((e) => Boolean(e.reflectionQuestion));

  // Synthesize new Weekly Note
  const handleGenerateWeeklyNote = async () => {
    if (!currentUser || !userProfile) return;
    setIsSynthesizing(true);
    try {
      const response = await fetch("/api/weekly-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.uid,
        },
        body: JSON.stringify({
          entries: entries.slice(0, 15),
          traits: userProfile.desiredTraits,
          personBecoming: userProfile.personBecoming,
        }),
      });

      if (!response.ok) {
        throw new Error("Weekly note generation failed");
      }

      const data = await response.json();
      const newNote: WeeklyNote = {
        id: `note_${Date.now()}`,
        userId: currentUser.uid,
        weekLabel: data.weekLabel || `Week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        themes: data.themes || ["Personal evolution"],
        growthSignal: data.growthSignal || "Steadily showing up for your own reflections.",
        nextWeekFocus: data.nextWeekFocus || "Continue deepening your intentional practices.",
        entryCount: entries.length,
        createdAt: new Date().toISOString(),
      };

      await saveWeeklyNote(currentUser.uid, newNote);
      setWeeklyNotes([newNote, ...weeklyNotes]);
      setActiveWeeklyNote(newNote);
    } catch (e) {
      console.error("[Weekly Note Synthesis Error]:", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* View Title */}
      <div className="border-b border-[#E8EAE4] pb-6 space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
          Reflect
        </h1>
        <p className="text-sm text-[#5A605A] font-light">
          Observations drawn from your experiences. Reflection before advice.
        </p>
      </div>

      {/* Primary Reflection Card: Latest Question */}
      {latestEntryWithQuestion ? (
        <div className="p-8 rounded-3xl bg-[#F4F6F1] border border-[#DEE2D8] space-y-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#626862]">
            <span className="font-semibold uppercase tracking-wider text-[#2D3A2F]">
              A question for you
            </span>
            <span>
              From {new Date(latestEntryWithQuestion.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>

          <p className="font-serif text-2xl sm:text-3xl text-[#1E201E] font-normal leading-snug">
            "{latestEntryWithQuestion.reflectionQuestion}"
          </p>

          {latestEntryWithQuestion.growthSignal && (
            <div className="pt-2 text-xs text-[#4A504A]">
              <span className="font-semibold text-[#2D3A2F]">Something we've noticed: </span>
              {latestEntryWithQuestion.growthSignal}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-[#E0E4DC] text-center space-y-3">
          <Feather className="w-6 h-6 text-[#7A807A] mx-auto" />
          <h3 className="font-serif text-lg text-[#1E201E]">Your reflection loop is ready</h3>
          <p className="text-xs text-[#606460] max-w-sm mx-auto">
            Once you log an entry in Today, Rei will formulate one tailored question to deepen your understanding.
          </p>
        </div>
      )}

      {/* Two Column Section: Recurring Themes & Your Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Recurring Themes */}
        <div className="p-6 rounded-2xl bg-white border border-[#E0E4DC] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F2ED] pb-3">
            <h3 className="font-serif text-lg text-[#1E201E]">Something we've noticed</h3>
            <span className="text-xs text-[#7A807A]">Themes</span>
          </div>

          {topThemes.length > 0 ? (
            <div className="space-y-2.5">
              {topThemes.map(([theme, count]) => (
                <div
                  key={theme}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9F6] border border-[#E8EBE4] text-xs"
                >
                  <span className="font-medium text-[#2E312E]">{theme}</span>
                  <span className="text-[#7A807A]">
                    {count} {count === 1 ? "time" : "times"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7A807A] italic py-4">
              Write 2-3 entries to surface recurring themes in how you experience your days.
            </p>
          )}
        </div>

        {/* Card 2: Your Patterns */}
        <div className="p-6 rounded-2xl bg-white border border-[#E0E4DC] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F2ED] pb-3">
            <h3 className="font-serif text-lg text-[#1E201E]">Your patterns</h3>
            <span className="text-xs text-[#7A807A]">Observed behaviors</span>
          </div>

          {entries.length > 0 ? (
            <div className="space-y-3">
              {entries
                .filter((e) => e.behavior)
                .slice(0, 4)
                .map((e) => (
                  <div key={e.id} className="text-xs border-l-2 border-[#2D3A2F] pl-3 py-1 space-y-0.5">
                    <p className="text-[#2E312E] font-medium">{e.behavior}</p>
                    <p className="text-[11px] text-[#7A807A]">
                      {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} •{" "}
                      {e.relatedTrait || "Trait"}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-[#7A807A] italic py-4">
              Observations of your choices and actions will appear here as you log reflections.
            </p>
          )}
        </div>
      </div>

      {/* Weekly Note Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#DEE2D8] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2ED] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2D3A2F]"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#3C4A3E]">
                Your Week
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-[#1E201E] font-normal mt-1">
              Weekly Synthesis
            </h3>
          </div>

          <button
            onClick={handleGenerateWeeklyNote}
            disabled={isSynthesizing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] disabled:opacity-50 text-white text-xs font-medium transition-all self-start sm:self-auto"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeWeeklyNote ? "Re-synthesize Week" : "Generate This Week's Note"}</span>
              </>
            )}
          </button>
        </div>

        {activeWeeklyNote ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-[#7A807A]">
              <span className="font-medium text-[#2D3A2F]">{activeWeeklyNote.weekLabel}</span>
              <span>Based on {activeWeeklyNote.entryCount} reflections</span>
            </div>

            {/* Growth Signal */}
            <div className="p-4 rounded-xl bg-[#F6F8F4] border border-[#DFE3DA] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3A453C]">
                Observable Growth Signal
              </span>
              <p className="text-sm text-[#1E201E] leading-relaxed">
                {activeWeeklyNote.growthSignal}
              </p>
            </div>

            {/* Recurring Themes */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A807A]">
                Key Weekly Themes
              </span>
              <div className="flex flex-wrap gap-2">
                {activeWeeklyNote.themes.map((th) => (
                  <span
                    key={th}
                    className="px-3 py-1 rounded-full bg-white border border-[#DCE0D8] text-xs text-[#383C38]"
                  >
                    {th}
                  </span>
                ))}
              </div>
            </div>

            {/* Next Week Focus */}
            <div className="p-4 rounded-xl bg-white border border-[#E0E4DC] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A807A]">
                Next-Week Focus
              </span>
              <p className="text-sm text-[#2E312E] italic leading-relaxed">
                "{activeWeeklyNote.nextWeekFocus}"
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#7A807A] space-y-2">
            <p>
              {entries.length < 2
                ? "Welcome back. What's been happening? Log a couple of reflections to generate a synthesized weekly note."
                : "Click above to synthesize your entries into this week's note."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

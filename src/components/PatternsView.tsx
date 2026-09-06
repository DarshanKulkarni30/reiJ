import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalInteraction, PatternInsight } from "../types";
import { getJournalInteractions, getPatternInsights, savePatternInsight } from "../lib/storage";
import { GitCommit, Sparkles, RefreshCw, MessageSquare, Calendar, Quote, Check, ArrowRight } from "lucide-react";

export const PatternsView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [activeReflections, setActiveReflections] = useState<Record<string, string>>({});
  const [savedReflections, setSavedReflections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [loadedEntries, loadedPatterns] = await Promise.all([
          getJournalInteractions(currentUser.uid),
          getPatternInsights(currentUser.uid),
        ]);
        setEntries(loadedEntries);
        setPatterns(loadedPatterns);

        // Pre-populate reflection fields
        const refMap: Record<string, string> = {};
        loadedPatterns.forEach((p) => {
          if (p.userReflection) {
            refMap[p.id] = p.userReflection;
          }
        });
        setActiveReflections(refMap);
      } catch (err) {
        console.error("Failed to load patterns:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  // Request pattern synthesis from server (strictly user's real entries only)
  const handleDetectPatterns = async () => {
    if (!currentUser || entries.length < 2) return;
    setIsDetecting(true);
    try {
      const res = await fetch("/api/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          traits: userProfile?.desiredTraits || [],
          personBecoming: userProfile?.personBecoming || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.patterns) && data.patterns.length > 0) {
          const freshPatterns: PatternInsight[] = data.patterns.map((p: any) => ({
            id: p.id || `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            theme: p.theme || "Recurring Pattern",
            patternSummary: p.patternSummary,
            occurrenceCount: p.occurrenceCount || 2,
            dates: p.dates || [],
            entryIds: p.entryIds || [],
            evidenceQuotes: p.evidenceQuotes || [],
            followUpQuestion: p.followUpQuestion,
            createdAt: new Date().toISOString(),
          }));

          setPatterns(freshPatterns);
          for (const pat of freshPatterns) {
            await savePatternInsight(currentUser.uid, pat);
          }
        }
      }
    } catch (err) {
      console.error("Pattern detection failed:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveReflection = async (pattern: PatternInsight) => {
    if (!currentUser) return;
    const answer = activeReflections[pattern.id];
    if (!answer?.trim()) return;

    try {
      const updated: PatternInsight = {
        ...pattern,
        userReflection: answer.trim(),
      };
      await savePatternInsight(currentUser.uid, updated);
      setPatterns((prev) => prev.map((p) => (p.id === pattern.id ? updated : p)));
      setSavedReflections((prev) => ({ ...prev, [pattern.id]: true }));
      setTimeout(() => {
        setSavedReflections((prev) => ({ ...prev, [pattern.id]: false }));
      }, 2000);
    } catch (e) {
      console.error("Failed to save pattern reflection:", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8EAE4] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2D3A2F]"></span>
            <span className="text-xs uppercase tracking-widest text-[#5A605A] font-semibold">
              Emerging Insights
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
            Patterns
          </h1>
          <p className="text-sm text-[#5A605A] font-light">
            Connecting similar moments across your past entries. Never imagined; drawn strictly from your real reflections.
          </p>
        </div>

        <button
          id="detect-patterns-btn"
          onClick={handleDetectPatterns}
          disabled={isDetecting || entries.length < 2}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] disabled:opacity-50 text-white text-xs font-medium transition-all shadow-xs self-start sm:self-auto"
        >
          {isDetecting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting Entries...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Detect Patterns</span>
            </>
          )}
        </button>
      </div>

      {entries.length < 2 && (
        <div className="p-6 rounded-2xl bg-[#F6F7F3] border border-[#DEE2D8] text-xs text-[#5A605A] space-y-1">
          <p className="font-semibold text-[#1E201E]">At least two reflections required</p>
          <p>
            Rei requires at least two saved reflections to discover authentic patterns across your writings without inventing history.
          </p>
        </div>
      )}

      {/* Pattern Cards List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#7A807A]">
          Reviewing your past reflections...
        </div>
      ) : patterns.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white p-8 rounded-3xl border border-[#DEE2D8]">
          <GitCommit className="w-8 h-8 text-[#A0A69E] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-[#1E201E]">No recurring patterns logged yet</h3>
            <p className="text-xs text-[#6A706A] max-w-md mx-auto">
              Click <strong>"Detect Patterns"</strong> to analyze your existing reflections and discover how your thoughts and reactions connect.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {patterns.map((pat, idx) => {
            const hasSaved = savedReflections[pat.id];
            return (
              <div
                key={pat.id}
                className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E0E4DC] shadow-xs space-y-6"
              >
                {/* Pattern Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F2ED] pb-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2D3A2F]">
                      Pattern #{idx + 1} • {pat.theme}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1E201E] font-normal">
                      {pat.patternSummary}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#7A807A] bg-[#F6F7F3] px-3 py-1 rounded-full border border-[#EAECE6]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Seen across {pat.dates.length || pat.occurrenceCount} reflections</span>
                  </div>
                </div>

                {/* Evidence in User's Words */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6A706A] flex items-center gap-1.5">
                    <Quote className="w-3 h-3 text-[#2D3A2F]" />
                    <span>Evidence in your own words (Never invented)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pat.evidenceQuotes && pat.evidenceQuotes.length > 0 ? (
                      pat.evidenceQuotes.map((ev, eIdx) => (
                        <div
                          key={eIdx}
                          className="p-3.5 rounded-xl bg-[#FAFBF8] border border-[#E4E8DF] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[#808880] text-[11px]">
                            <span>{ev.date || "Logged entry"}</span>
                            <span>Direct quote</span>
                          </div>
                          <p className="text-xs text-[#282C28] italic leading-relaxed">
                            "{ev.quote}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-[#FAFBF8] text-xs text-[#808880] italic">
                        Signals identified from entry themes on {pat.dates.join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* One Follow-Up Question */}
                <div className="p-5 rounded-2xl bg-[#F6F8F4] border border-[#DEE2D8] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D3A2F]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>A Question For You</span>
                  </div>

                  <p className="font-serif text-lg sm:text-xl text-[#1E201E] leading-relaxed">
                    {pat.followUpQuestion}
                  </p>

                  {/* User Answer / Reflection Input */}
                  <div className="pt-2 space-y-2">
                    <textarea
                      rows={2}
                      value={activeReflections[pat.id] || ""}
                      onChange={(e) =>
                        setActiveReflections({ ...activeReflections, [pat.id]: e.target.value })
                      }
                      placeholder="Write your honest observation on this pattern..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE0D8] bg-white text-xs sm:text-sm text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#1E201E] leading-relaxed"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveReflection(pat)}
                        className="px-4 py-1.5 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] text-white text-xs font-medium transition-all flex items-center gap-1.5"
                      >
                        {hasSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Saved to Your Model</span>
                          </>
                        ) : (
                          <>
                            <span>Save Reflection</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

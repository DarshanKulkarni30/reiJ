import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalInteraction, TraitModel } from "../types";
import { getJournalInteractions, getTraitModels, saveTraitModel } from "../lib/storage";
import { Sparkles, CheckCircle2, ArrowUpRight, Compass, RefreshCw, Feather } from "lucide-react";

export const GrowView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [traitModels, setTraitModels] = useState<TraitModel[]>([]);
  const [selectedTraitIndex, setSelectedTraitIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const desiredTraits = userProfile?.desiredTraits || ["Confidence", "Discipline", "Focus"];
  const activeTrait = desiredTraits[selectedTraitIndex] || desiredTraits[0];

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [loadedEntries, loadedModels] = await Promise.all([
          getJournalInteractions(currentUser.uid),
          getTraitModels(currentUser.uid),
        ]);
        setEntries(loadedEntries);
        setTraitModels(loadedModels);
      } catch (err) {
        console.error("Failed to load grow data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  // Find entries that relate to this active trait
  const relevantEntries = entries.filter(
    (e) =>
      e.relatedTrait?.toLowerCase() === activeTrait.toLowerCase() ||
      e.freeWrite.toLowerCase().includes(activeTrait.toLowerCase()) ||
      (e.intention && e.intention.toLowerCase().includes(activeTrait.toLowerCase()))
  );

  // Default micro-practices for common traits
  const defaultPractices: Record<string, { behavior: string; practice: string }> = {
    Confidence: {
      behavior: "Voicing your perspective clearly without opening with a minimizing apology.",
      practice: "In your next conversation, state your idea directly without prefacing with 'I might be wrong, but...'.",
    },
    Discipline: {
      behavior: "Initiating your highest-leverage task before checking reactive communications.",
      practice: "Block 45 minutes first thing tomorrow morning for one single priority before opening email.",
    },
    Focus: {
      behavior: "Single-tasking to completion rather than toggling rapidly between open tabs.",
      practice: "Close all secondary tabs for the next work sprint; keep only your active document in view.",
    },
    Courage: {
      behavior: "Leaning into the difficult conversation rather than delaying it to avoid discomfort.",
      practice: "Write down the exact sentence you need to say to someone today and initiate the check-in.",
    },
    Patience: {
      behavior: "Taking one full inhalation before responding to an irritating or rushed situation.",
      practice: "When interrupted or delayed today, count to three before formulating your reply.",
    },
    Leadership: {
      behavior: "Creating clarity and psychological safety for others before asserting control.",
      practice: "Ask someone on your team: 'What is the biggest roadblock in your way right now?'",
    },
    Communication: {
      behavior: "Reflecting back what you heard before presenting your counter-argument.",
      practice: "Summarize the other person's core point in your own words before giving your response.",
    },
    Creativity: {
      behavior: "Protecting unstructured time to connect disparate ideas without immediate judgment.",
      practice: "Spend 15 minutes sketching three alternative angles to a challenge without filtering.",
    },
    "Self-belief": {
      behavior: "Trusting your judgment in moments of uncertainty based on accumulated experience.",
      practice: "Note one decision you made this week that turned out well because you trusted yourself.",
    },
    "Emotional balance": {
      behavior: "Witnessing emotional spikes as transient waves rather than absolute directives.",
      practice: "When feeling reactive, label the emotion neutrally: 'There is tension here right now.'",
    },
    Consistency: {
      behavior: "Honoring a small baseline habit regardless of daily fluctuations in motivation.",
      practice: "Commit to completing just two minutes of your chosen practice even if exhausted.",
    },
  };

  const traitInfo = defaultPractices[activeTrait] || {
    behavior: `Observing the subtle moments where ${activeTrait.toLowerCase()} is challenged or expressed.`,
    practice: `Choose one conscious moment today to pause and embody ${activeTrait.toLowerCase()}.`,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E8EAE4] pb-6 space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
          Grow
        </h1>
        <p className="text-sm text-[#5A605A] font-light">
          Converting your chosen traits into observable behaviors and real evidence.
        </p>
      </div>

      {/* Trait Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {desiredTraits.map((trait, index) => {
          const active = index === selectedTraitIndex;
          return (
            <button
              key={trait}
              onClick={() => setSelectedTraitIndex(index)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? "bg-[#1E201E] text-white border-[#1E201E] shadow-xs"
                  : "bg-white text-[#4A4E4A] border-[#DCE0D8] hover:bg-[#F2F4F0]"
              }`}
            >
              {trait}
            </button>
          );
        })}
      </div>

      {/* Trait Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Observable Behavior */}
        <div className="p-6 rounded-2xl bg-white border border-[#E0E4DC] space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#2D3A2F] font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Observable Behavior</span>
          </div>
          <h3 className="font-serif text-xl text-[#1E201E] font-normal">
            What it looks like in practice
          </h3>
          <p className="text-sm text-[#404440] leading-relaxed font-sans">
            {traitInfo.behavior}
          </p>
        </div>

        {/* One Small Practice */}
        <div className="p-6 rounded-2xl bg-[#F6F8F4] border border-[#DEE2D8] space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#2D3A2F] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>One Small Practice</span>
          </div>
          <h3 className="font-serif text-xl text-[#1E201E] font-normal">
            Test this today
          </h3>
          <p className="text-sm text-[#383C38] leading-relaxed font-sans">
            {traitInfo.practice}
          </p>
        </div>
      </div>

      {/* Evidence from Entries */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#DEE2D8] space-y-6">
        <div className="flex items-center justify-between border-b border-[#F0F2ED] pb-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3C4A3E]">
              Evidence From Entries
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[#1E201E] font-normal">
              Measured in your own words
            </h3>
          </div>
          <span className="text-xs text-[#7A807A]">
            {relevantEntries.length} {relevantEntries.length === 1 ? "reflection" : "reflections"}
          </span>
        </div>

        {relevantEntries.length > 0 ? (
          <div className="space-y-4">
            {relevantEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-[#FAFBF8] border border-[#E5E9E1] text-xs space-y-2"
              >
                <div className="flex items-center justify-between text-[#7A807A]">
                  <span>
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {entry.emotion && (
                    <span className="text-[#383C38] font-medium">{entry.emotion}</span>
                  )}
                </div>

                <p className="text-sm text-[#2E312E] italic leading-relaxed">
                  "{entry.freeWrite.slice(0, 220)}..."
                </p>

                {entry.behavior && (
                  <div className="pt-1.5 border-t border-[#EDF0EA] flex items-center gap-1.5 text-[#2D3A2F]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Observed: {entry.behavior}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-[#7A807A] space-y-2">
            <p>
              No direct entries logged yet for <strong>{activeTrait}</strong>.
            </p>
            <p className="text-[#888E88]">
              When you write about {activeTrait.toLowerCase()} in your Today reflections, quotes and signals will gather here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalInteraction, TraitModel, PracticeRecord } from "../types";
import {
  getJournalInteractions,
  getTraitModels,
  saveTraitModel,
  getPractices,
  savePractice,
} from "../lib/storage";
import {
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Compass,
  RefreshCw,
  MessageSquare,
  Bookmark,
  Check,
  History,
} from "lucide-react";

export const GrowView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [traitModels, setTraitModels] = useState<TraitModel[]>([]);
  const [practices, setPractices] = useState<PracticeRecord[]>([]);
  const [selectedTraitIndex, setSelectedTraitIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Practice Loop input state
  const [practiceOutcome, setPracticeOutcome] = useState<string>("");
  const [savingEvidence, setSavingEvidence] = useState<boolean>(false);
  const [evidenceSavedSuccess, setEvidenceSavedSuccess] = useState<boolean>(false);

  const desiredTraits = userProfile?.desiredTraits || ["Confidence", "Discipline", "Focus"];
  const activeTrait = desiredTraits[selectedTraitIndex] || desiredTraits[0];

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [loadedEntries, loadedModels, loadedPractices] = await Promise.all([
          getJournalInteractions(currentUser.uid),
          getTraitModels(currentUser.uid),
          getPractices(currentUser.uid),
        ]);
        setEntries(loadedEntries);
        setTraitModels(loadedModels);
        setPractices(loadedPractices);
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

  // Saved practice records for the active trait
  const traitPractices = practices.filter(
    (p) => p.trait.toLowerCase() === activeTrait.toLowerCase()
  );

  // Handle Saving Evidence for the Practice Loop
  const handleSavePracticeEvidence = async () => {
    if (!currentUser || !practiceOutcome.trim()) return;
    setSavingEvidence(true);
    try {
      const newPractice: PracticeRecord = {
        id: `prac-${Date.now()}`,
        userId: currentUser.uid,
        trait: activeTrait,
        behavior: traitInfo.behavior,
        practicePrompt: traitInfo.practice,
        status: "reflected",
        whatHappened: practiceOutcome.trim(),
        savedEvidence: practiceOutcome.trim(),
        createdAt: new Date().toISOString(),
        reflectedAt: new Date().toISOString(),
      };

      await savePractice(currentUser.uid, newPractice);
      setPractices((prev) => [newPractice, ...prev]);

      // Update model evidence quotes as well
      const existingModel = traitModels.find(
        (m) => m.trait.toLowerCase() === activeTrait.toLowerCase()
      );
      if (existingModel) {
        const updatedModel: TraitModel = {
          ...existingModel,
          evidenceQuotes: [practiceOutcome.trim().slice(0, 160), ...(existingModel.evidenceQuotes || [])].slice(0, 8),
          updatedAt: new Date().toISOString(),
        };
        await saveTraitModel(currentUser.uid, updatedModel);
        setTraitModels((prev) =>
          prev.map((m) => (m.trait.toLowerCase() === activeTrait.toLowerCase() ? updatedModel : m))
        );
      }

      setPracticeOutcome("");
      setEvidenceSavedSuccess(true);
      setTimeout(() => setEvidenceSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save practice evidence:", err);
    } finally {
      setSavingEvidence(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E8EAE4] pb-6 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2D3A2F]"></span>
          <span className="text-xs uppercase tracking-widest text-[#5A605A] font-semibold">
            Observable Behaviors
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
          Grow
        </h1>
        <p className="text-sm text-[#5A605A] font-light">
          Converting your chosen traits into observable behaviors, micro-practices, and tested evidence.
        </p>
      </div>

      {/* Trait Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {desiredTraits.map((trait, index) => {
          const active = index === selectedTraitIndex;
          return (
            <button
              key={trait}
              onClick={() => {
                setSelectedTraitIndex(index);
                setPracticeOutcome("");
              }}
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

      {/* Trait Cards */}
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
            Behavior to try
          </h3>
          <p className="text-sm text-[#383C38] leading-relaxed font-sans">
            {traitInfo.practice}
          </p>
        </div>
      </div>

      {/* PRACTICE LOOP: Ask What Happened & Save Evidence */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#2D3A2F]/30 shadow-xs space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D3A2F]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>The Practice Loop</span>
          </div>
          <h3 className="font-serif text-2xl text-[#1E201E] font-normal">
            What happened when you tried this?
          </h3>
          <p className="text-xs text-[#5A605A] font-light">
            When you put this practice into the real world, what did you observe? Document the reality — both friction and small wins.
          </p>
        </div>

        <div className="space-y-3">
          <textarea
            rows={3}
            value={practiceOutcome}
            onChange={(e) => setPracticeOutcome(e.target.value)}
            placeholder={`In your own words: e.g. "During the 10am meeting, I paused for 2 seconds before answering the question. It felt uncomfortable at first, but my response was far clearer..."`}
            className="w-full px-4 py-3 rounded-2xl border border-[#DCE0D8] bg-[#FAFBF8] text-sm text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#1E201E] leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-[#7A807A]">
              Saving builds real, grounded evidence in <strong>Your Model</strong>.
            </span>

            <button
              onClick={handleSavePracticeEvidence}
              disabled={savingEvidence || !practiceOutcome.trim()}
              className="px-5 py-2.5 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] disabled:opacity-40 text-white text-xs font-medium transition-all shadow-xs flex items-center gap-2"
            >
              {savingEvidence ? (
                <span>Saving Evidence...</span>
              ) : evidenceSavedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Evidence Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Evidence</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* List of Saved Evidence for this Trait */}
        {traitPractices.length > 0 && (
          <div className="pt-5 border-t border-[#F0F2ED] space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6A706A] flex items-center gap-1.5">
              <History className="w-3 h-3 text-[#2D3A2F]" />
              <span>Tested Evidence for {activeTrait} ({traitPractices.length})</span>
            </span>

            <div className="space-y-2.5">
              {traitPractices.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[#F8FAF6] border border-[#E2E6DE] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[#7A807A] text-[11px]">
                    <span>
                      {new Date(p.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-[#2D3A2F] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Action</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#282C28] italic leading-relaxed">
                    "{p.whatHappened || p.savedEvidence}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Relevant Reflections from Daily Journal */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#DEE2D8] space-y-6">
        <div className="flex items-center justify-between border-b border-[#F0F2ED] pb-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3C4A3E]">
              Journal Signals
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[#1E201E] font-normal">
              Reflections tagged with {activeTrait}
            </h3>
          </div>
          <span className="text-xs text-[#7A807A]">
            {relevantEntries.length} {relevantEntries.length === 1 ? "entry" : "entries"}
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
          <div className="py-8 text-center text-xs text-[#7A807A] space-y-1">
            <p>No direct entries logged yet for <strong>{activeTrait}</strong>.</p>
            <p className="text-[#888E88]">
              When you write about {activeTrait.toLowerCase()} in your daily entries, quotes will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

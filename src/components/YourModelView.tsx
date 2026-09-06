import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { TraitModel, JournalInteraction } from "../types";
import { getJournalInteractions, getTraitModels, saveTraitModel } from "../lib/storage";
import { Sparkles, RefreshCw, Compass, ArrowRight, ShieldCheck } from "lucide-react";

export const YourModelView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [traitModels, setTraitModels] = useState<TraitModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const desiredTraits = userProfile?.desiredTraits || ["Confidence", "Discipline", "Focus"];

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

        // If no models exist yet, initialize baseline models for the 3 desired traits
        if (loadedModels.length === 0 && desiredTraits.length > 0) {
          const baselines: TraitModel[] = desiredTraits.map((trait) => ({
            trait,
            potential: `Natural capacity to manifest ${trait.toLowerCase()} when operating in high alignment.`,
            observed: `Initial evidence taking shape as reflections are recorded.`,
            desired: `Effortless and grounded embodiment of ${trait.toLowerCase()} across challenging circumstances.`,
            evidenceQuotes: [],
            practices: [`Notice the moments today where ${trait.toLowerCase()} is called upon.`],
            updatedAt: new Date().toISOString(),
          }));
          setTraitModels(baselines);
          for (const m of baselines) {
            await saveTraitModel(currentUser.uid, m);
          }
        } else {
          setTraitModels(loadedModels);
        }
      } catch (e) {
        console.error("Failed to load living model:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser, userProfile]);

  // Synthesize and update living model with new signals from entries
  const handleUpdateModel = async () => {
    if (!currentUser || !userProfile) return;
    setIsUpdating(true);
    try {
      const updatedList: TraitModel[] = [];
      for (const trait of desiredTraits) {
        const relevant = entries.filter(
          (e) =>
            e.relatedTrait?.toLowerCase() === trait.toLowerCase() ||
            e.freeWrite.toLowerCase().includes(trait.toLowerCase())
        );

        const res = await fetch("/api/model-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trait,
            entries: relevant,
            personBecoming: userProfile.personBecoming,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const updated: TraitModel = {
            trait,
            potential: data.potential,
            observed: data.observed,
            desired: data.desired,
            evidenceQuotes: data.evidenceQuotes || [],
            practices: data.practices || [],
            updatedAt: new Date().toISOString(),
          };
          await saveTraitModel(currentUser.uid, updated);
          updatedList.push(updated);
        }
      }
      setTraitModels(updatedList);
    } catch (e) {
      console.error("Failed to update model:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Title & Philosophy Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8EAE4] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2D3A2F]"></span>
            <span className="text-xs uppercase tracking-widest text-[#5A605A] font-semibold">
              Living Personal Model
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
            Your Model
          </h1>
          <p className="text-sm text-[#5A605A] font-light">
            This is not a static personality report. It is what we are learning about your potential, your actions, and your trajectory.
          </p>
        </div>

        <button
          id="update-living-model-btn"
          onClick={handleUpdateModel}
          disabled={isUpdating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] disabled:opacity-50 text-white text-xs font-medium transition-all shadow-xs self-start sm:self-auto"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing Signals...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update From Signals</span>
            </>
          )}
        </button>
      </div>

      {/* The Anchor: The Person You're Becoming */}
      {userProfile?.personBecoming && (
        <div className="p-6 rounded-2xl bg-[#F6F7F3] border border-[#E1E5DC] space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6A706A]">
            The Person You're Becoming
          </span>
          <p className="font-serif text-lg sm:text-xl text-[#1E201E] italic leading-relaxed">
            "{userProfile.personBecoming}"
          </p>
        </div>
      )}

      {/* The 3 Core Columns for each Trait: Potential | Observed | Desired */}
      <div className="space-y-8">
        {desiredTraits.map((traitName) => {
          const model = traitModels.find(
            (m) => m.trait.toLowerCase() === traitName.toLowerCase()
          ) || {
            trait: traitName,
            potential: `Natural capacity to manifest ${traitName.toLowerCase()} with composure and intent.`,
            observed: `Observing daily reflections to track instances of ${traitName.toLowerCase()}.`,
            desired: `Steady, instinctive embodiment of ${traitName.toLowerCase()} in your everyday decisions.`,
          };

          return (
            <div
              key={traitName}
              className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E0E4DC] shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#F0F2ED] pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#2D3A2F]"></span>
                  <h3 className="font-serif text-2xl text-[#1E201E] font-normal tracking-tight">
                    {traitName}
                  </h3>
                </div>
                <span className="text-xs text-[#7A807A]">
                  {entries.filter((e) => e.relatedTrait === traitName).length} signals logged
                </span>
              </div>

              {/* 3-Column Architecture: Potential | Observed | Desired */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Column 1: Potential */}
                <div className="p-5 rounded-2xl bg-[#FAFBF8] border border-[#E6EAE2] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#6A706A] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#828882]"></span>
                    <span>Potential</span>
                  </div>
                  <p className="text-sm text-[#2E312E] leading-relaxed font-sans">
                    {model.potential}
                  </p>
                  <p className="text-[11px] text-[#888E88] italic pt-1">
                    Working hypothesis of latent capacity
                  </p>
                </div>

                {/* Column 2: Observed */}
                <div className="p-5 rounded-2xl bg-[#F4F6F1] border border-[#DEE2D8] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#2D3A2F] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D3A2F]"></span>
                    <span>Observed</span>
                  </div>
                  <p className="text-sm text-[#1E201E] leading-relaxed font-sans">
                    {model.observed}
                  </p>
                  <p className="text-[11px] text-[#727872] italic pt-1">
                    Evidence from actual journal logs
                  </p>
                </div>

                {/* Column 3: Desired */}
                <div className="p-5 rounded-2xl bg-[#FAFBF8] border border-[#E6EAE2] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#6A706A] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#828882]"></span>
                    <span>Desired</span>
                  </div>
                  <p className="text-sm text-[#2E312E] leading-relaxed font-sans">
                    {model.desired}
                  </p>
                  <p className="text-[11px] text-[#888E88] italic pt-1">
                    Target mature manifestation
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Understated Philosophy Note */}
      <div className="p-6 rounded-2xl border border-dashed border-[#D5D9D0] bg-white/50 text-xs text-[#626862] leading-relaxed space-y-1">
        <p className="font-medium text-[#1E201E]">How Your Model evolves:</p>
        <p>
          Rei never declares "this is who you are." Instead, every reflection you save adds observable evidence to the <strong>Observed</strong> column, testing the <strong>Potential</strong> hypothesis and drawing you closer to your <strong>Desired</strong> future state.
        </p>
      </div>
    </div>
  );
};

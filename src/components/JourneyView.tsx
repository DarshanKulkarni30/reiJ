import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalInteraction } from "../types";
import { getJournalInteractions } from "../lib/storage";
import { Compass, Calendar, Sparkles, Filter, Clock, ChevronRight, Bookmark } from "lucide-react";

interface JourneyViewProps {
  onSelectEntry: (entry: JournalInteraction) => void;
  onWriteNew: () => void;
}

export const JourneyView: React.FC<JourneyViewProps> = ({ onSelectEntry, onWriteNew }) => {
  const { currentUser, userProfile } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const loaded = await getJournalInteractions(currentUser.uid);
        setEntries(loaded);
      } catch (err) {
        console.error("Failed to load journey entries:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  // Extract all themes present in entries
  const allThemesSet = new Set<string>();
  entries.forEach((e) => {
    if (e.theme) allThemesSet.add(e.theme);
    if (e.relatedTrait) allThemesSet.add(e.relatedTrait);
  });
  const availableThemes = ["All", ...Array.from(allThemesSet).slice(0, 8)];

  // Filter entries by theme if selected
  const filteredEntries = entries.filter((e) => {
    if (selectedTheme === "All") return true;
    return (
      e.theme?.toLowerCase() === selectedTheme.toLowerCase() ||
      e.relatedTrait?.toLowerCase() === selectedTheme.toLowerCase() ||
      e.freeWrite.toLowerCase().includes(selectedTheme.toLowerCase())
    );
  });

  // Group entries by time horizon
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: { label: string; items: JournalInteraction[] }[] = [
    {
      label: "This Week",
      items: filteredEntries.filter((e) => new Date(e.createdAt) >= sevenDaysAgo),
    },
    {
      label: "Last Week",
      items: filteredEntries.filter((e) => {
        const d = new Date(e.createdAt);
        return d < sevenDaysAgo && d >= fourteenDaysAgo;
      }),
    },
    {
      label: "Earlier This Month",
      items: filteredEntries.filter((e) => {
        const d = new Date(e.createdAt);
        return d < fourteenDaysAgo && d >= thirtyDaysAgo;
      }),
    },
    {
      label: "Previous Milestones",
      items: filteredEntries.filter((e) => new Date(e.createdAt) < thirtyDaysAgo),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E8EAE4] pb-6 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2D3A2F]"></span>
          <span className="text-xs uppercase tracking-widest text-[#5A605A] font-semibold">
            Timeline of Evolution
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
          Journey
        </h1>
        <p className="text-sm text-[#5A605A] font-light">
          Your thoughts and behaviors mapped across time and recurring themes.
        </p>
      </div>

      {/* Filter by Theme */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6A706A]">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by Theme & Trait</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {availableThemes.map((theme) => {
            const active = selectedTheme === theme;
            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  active
                    ? "bg-[#1E201E] text-white border-[#1E201E] shadow-xs"
                    : "bg-white text-[#404440] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                }`}
              >
                {theme}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Timeline Stream */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#7A807A]">
          Mapping your timeline...
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white p-8 rounded-3xl border border-[#DEE2D8]">
          <Compass className="w-8 h-8 text-[#A0A69E] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-[#1E201E]">Your timeline is just beginning</h3>
            <p className="text-xs text-[#6A706A] max-w-md mx-auto">
              As you record reflections in Today, each entry marks a station along your journey of intention.
            </p>
          </div>
          <button
            onClick={onWriteNew}
            className="px-5 py-2 rounded-full bg-[#1E201E] text-white text-xs font-medium hover:bg-[#2D3A2F] transition-colors"
          >
            Record Today's Reflection
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.label} className="space-y-4">
              {/* Group Timeline Marker */}
              <div className="sticky top-18 z-10 bg-[#FBFBF9]/95 backdrop-blur-xs py-1 flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#2D3A2F]">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-[#E0E4DC]"></div>
                <span className="text-[11px] text-[#7A807A]">
                  {group.items.length} {group.items.length === 1 ? "reflection" : "reflections"}
                </span>
              </div>

              {/* Entries in this Time Group */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-[#E2E6DE] space-y-6">
                {group.items.map((entry) => {
                  return (
                    <div
                      key={entry.id}
                      onClick={() => onSelectEntry(entry)}
                      className="group relative bg-white p-5 sm:p-6 rounded-2xl border border-[#E0E4DC] hover:border-[#2D3A2F] shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-3"
                    >
                      {/* Timeline Node Icon */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-6 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#2D3A2F] group-hover:scale-125 transition-transform"></div>

                      {/* Card Header: Date & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-[#6A706A]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(entry.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span>{entry.time || "Daily"}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {entry.mood && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F4F6F1] text-[#2D3A2F] text-[11px] font-medium border border-[#DEE2D8]">
                              {entry.mood}
                            </span>
                          )}
                          {entry.relatedTrait && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#1E201E] text-white text-[11px] font-medium">
                              {entry.relatedTrait}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Intention if set */}
                      {entry.intention && (
                        <div className="text-xs text-[#404440] font-medium flex items-center gap-1.5">
                          <Bookmark className="w-3 h-3 text-[#2D3A2F]" />
                          <span>Intention: "{entry.intention}"</span>
                        </div>
                      )}

                      {/* Excerpt in User's Words */}
                      <p className="font-serif text-base text-[#1E201E] italic line-clamp-3 leading-relaxed">
                        "{entry.freeWrite}"
                      </p>

                      {/* Observed Signal / Behavior */}
                      {entry.behavior && (
                        <div className="pt-2 border-t border-[#F0F2ED] flex items-center justify-between text-xs text-[#5A605A]">
                          <span className="truncate max-w-[80%]">
                            Observed: <strong className="font-medium text-[#1E201E]">{entry.behavior}</strong>
                          </span>
                          <span className="flex items-center gap-0.5 text-[#2D3A2F] font-medium group-hover:translate-x-0.5 transition-transform">
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

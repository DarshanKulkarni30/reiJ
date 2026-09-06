import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalInteraction } from "../types";
import { getJournalInteractions } from "../lib/storage";
import { Search, Calendar, ChevronRight, Filter, BookOpen, Clock, MapPin, Camera } from "lucide-react";

interface JournalViewProps {
  onSelectEntry: (entry: JournalInteraction) => void;
  onWriteNew: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ onSelectEntry, onWriteNew }) => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTrait, setSelectedTrait] = useState<string>("All");

  useEffect(() => {
    async function loadEntries() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const list = await getJournalInteractions(currentUser.uid);
        setEntries(list);
      } catch (err) {
        console.error("Failed to load journal entries:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, [currentUser]);

  // Extract all unique traits present in entries
  const allTraits = Array.from(
    new Set(entries.map((e) => e.relatedTrait).filter(Boolean) as string[])
  );

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      !searchQuery.trim() ||
      e.freeWrite.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.intention && e.intention.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.theme && e.theme.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.reflectionQuestion && e.reflectionQuestion.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTrait = selectedTrait === "All" || e.relatedTrait === selectedTrait;

    return matchesSearch && matchesTrait;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8EAE4] pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201E] font-normal tracking-tight">
            Journal
          </h1>
          <p className="text-sm text-[#5A605A] font-light mt-1">
            Your personal record of experiences, intentions, and reflections.
          </p>
        </div>
        <button
          onClick={onWriteNew}
          className="px-4 py-2 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] text-white text-xs font-medium self-start sm:self-auto transition-colors"
        >
          + New Reflection
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#888E88] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="journal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries, intentions, questions..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D8DBD2] bg-white text-sm focus:outline-none focus:border-[#2D3A2F]"
          />
        </div>

        {allTraits.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedTrait("All")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedTrait === "All"
                  ? "bg-[#2D3A2F] text-white border-[#2D3A2F]"
                  : "bg-white text-[#525752] border-[#DCE0D8] hover:bg-[#F2F4F0]"
              }`}
            >
              All Traits
            </button>
            {allTraits.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTrait(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  selectedTrait === t
                    ? "bg-[#2D3A2F] text-white border-[#2D3A2F]"
                    : "bg-white text-[#525752] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entry List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#828882] space-y-2">
          <div className="w-6 h-6 border-2 border-[#1E201E] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Retrieving your private history...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#D8DBD2] rounded-2xl p-8 bg-white/60 space-y-4">
          <BookOpen className="w-8 h-8 text-[#888E88] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-[#1E201E]">No entries found</h3>
            <p className="text-xs text-[#606460] max-w-sm mx-auto">
              {entries.length === 0
                ? "Your journal is waiting. Complete today's reflection to begin building your living model."
                : "No entries match your search criteria."}
            </p>
          </div>
          {entries.length === 0 && (
            <button
              onClick={onWriteNew}
              className="px-4 py-2 rounded-full bg-[#1E201E] text-white text-xs font-medium hover:bg-[#2D3A2F]"
            >
              Write your first entry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="p-5 rounded-2xl bg-white border border-[#E0E4DC] hover:border-[#2D3A2F] transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[#7A807A]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1E201E]">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>{entry.time || "Logged"}</span>
                  {entry.mood && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F2F4F0] text-[#383C38] font-medium">
                        {entry.mood}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {entry.location && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F2F5EF] text-[#2D3A2F] text-[10px] font-medium border border-[#DEE2D8]">
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="max-w-[120px] truncate">{entry.location.name}</span>
                    </span>
                  )}
                  {entry.photoUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F2F5EF] text-[#2D3A2F] text-[10px] font-medium border border-[#DEE2D8]">
                      <Camera className="w-2.5 h-2.5" />
                      <span>Photo</span>
                    </span>
                  )}
                  {entry.relatedTrait && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EBF0E9] text-[#2D3A2F] text-[11px] font-medium">
                      {entry.relatedTrait}
                    </span>
                  )}
                </div>
              </div>

              {/* User Entry Snippet */}
              <p className="text-sm text-[#2E312E] line-clamp-2 leading-relaxed font-sans mb-3">
                {entry.freeWrite}
              </p>

              {/* Rei's Reflection Question Teaser */}
              {entry.reflectionQuestion && (
                <div className="pt-3 border-t border-[#F0F2ED] flex items-center justify-between text-xs">
                  <p className="font-serif italic text-[#4A504A] truncate max-w-xl">
                    " {entry.reflectionQuestion} "
                  </p>
                  <ChevronRight className="w-4 h-4 text-[#888E88] group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { JournalInteraction } from "../types";
import { X, Calendar, Clock, Sparkles, Check } from "lucide-react";
import { saveJournalInteraction } from "../lib/storage";

interface EntryDetailModalProps {
  entry: JournalInteraction;
  onClose: () => void;
  onUpdateEntry: (updated: JournalInteraction) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onUpdateEntry,
}) => {
  const [eveningClose, setEveningClose] = useState<string>(entry.eveningClose || "");
  const [isEditingClose, setIsEditingClose] = useState<boolean>(false);
  const [isSavingClose, setIsSavingClose] = useState<boolean>(false);

  const handleSaveEveningClose = async () => {
    setIsSavingClose(true);
    try {
      const updated = {
        ...entry,
        eveningClose: eveningClose.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      await saveJournalInteraction(entry.userId, updated);
      onUpdateEntry(updated);
      setIsEditingClose(false);
    } catch (e) {
      console.error("Failed to update evening close:", e);
    } finally {
      setIsSavingClose(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E201E]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FBFBF9] border border-[#E0E3DD] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col justify-between overflow-y-auto space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#EAECE6] pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-[#7A807A]">
              <span>
                {new Date(entry.createdAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span>{entry.time || "Logged"}</span>
            </div>
            <h2 className="font-serif text-2xl text-[#1E201E]">Reflection Detail</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EFEFEA] text-[#606460] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entry Content */}
        <div className="space-y-6">
          {/* Metadata chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            {entry.mood && (
              <span className="px-3 py-1 rounded-full bg-white border border-[#DCE0D8] text-[#383C38]">
                State: <strong className="font-medium">{entry.mood}</strong>
              </span>
            )}
            {entry.relatedTrait && (
              <span className="px-3 py-1 rounded-full bg-[#EBF0E9] text-[#2D3A2F] font-medium">
                Trait: {entry.relatedTrait}
              </span>
            )}
            {entry.emotion && (
              <span className="px-3 py-1 rounded-full bg-white border border-[#DCE0D8] text-[#555A55]">
                Tone: {entry.emotion}
              </span>
            )}
          </div>

          {/* Intention */}
          {entry.intention && (
            <div className="p-3.5 rounded-xl bg-white border border-[#E0E4DC] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A807A]">
                Intention
              </span>
              <p className="text-sm text-[#1E201E]">{entry.intention}</p>
            </div>
          )}

          {/* Prompt Question */}
          {entry.promptQuestion && (
            <div className="p-3.5 rounded-xl bg-[#F4F5F1] border border-[#E3E6DF] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#727872]">
                Question Posed
              </span>
              <p className="font-serif text-base text-[#1E201E] italic">
                "{entry.promptQuestion}"
              </p>
            </div>
          )}

          {/* User's Free Write */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A807A]">
              Your Words
            </span>
            <div className="p-5 rounded-2xl bg-white border border-[#E0E4DC] text-base text-[#1E201E] leading-relaxed whitespace-pre-wrap font-sans">
              {entry.freeWrite}
            </div>
          </div>

          {/* Rei's Reflection Question */}
          {entry.reflectionQuestion && (
            <div className="p-5 rounded-2xl bg-[#F5F7F3] border border-[#D8DDD5] space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#3C4A3E]">
                A question for you
              </span>
              <p className="font-serif text-xl text-[#1E201E] font-normal leading-snug">
                "{entry.reflectionQuestion}"
              </p>
            </div>
          )}

          {/* Growth Signal */}
          {entry.growthSignal && (
            <div className="p-4 rounded-xl bg-white border border-[#E0E4DC] text-sm text-[#383C38]">
              <span className="font-semibold text-[#2D3A2F]">Something we've noticed: </span>
              {entry.growthSignal}
            </div>
          )}

          {/* Evening Close */}
          <div className="p-4 rounded-xl bg-white border border-[#E0E4DC] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A807A]">
                Evening Close
              </span>
              {!isEditingClose && (
                <button
                  onClick={() => setIsEditingClose(true)}
                  className="text-xs text-[#2D3A2F] hover:underline"
                >
                  {entry.eveningClose ? "Edit" : "+ Add evening close"}
                </button>
              )}
            </div>

            {isEditingClose ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={eveningClose}
                  onChange={(e) => setEveningClose(e.target.value)}
                  placeholder="Looking back on the day: What surprised you or shifted your perspective?"
                  className="w-full p-3 rounded-lg border border-[#D8DBD2] text-sm focus:outline-none focus:border-[#2D3A2F]"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsEditingClose(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#606460]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEveningClose}
                    disabled={isSavingClose}
                    className="px-3 py-1.5 rounded-lg bg-[#1E201E] text-white text-xs font-medium"
                  >
                    {isSavingClose ? "Saving..." : "Save Close"}
                  </button>
                </div>
              </div>
            ) : entry.eveningClose ? (
              <p className="text-sm text-[#2E312E] italic leading-relaxed">
                "{entry.eveningClose}"
              </p>
            ) : (
              <p className="text-xs text-[#888E88] italic">No evening close recorded for this day.</p>
            )}
          </div>
        </div>

        {/* Modal Bottom */}
        <div className="pt-4 border-t border-[#EAECE6] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#1E201E] text-white text-xs font-medium hover:bg-[#2D3A2F]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

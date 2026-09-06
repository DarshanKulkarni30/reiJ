import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserProfile } from "../types";
import { saveUserProfile } from "../lib/storage";
import { X, Check, Mail, Sparkles, User, Heart, Shield, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LIFE_CONTEXT_OPTIONS = [
  "Student",
  "Professional",
  "Manager",
  "Business owner",
  "Homemaker",
  "Parent",
  "Career transition",
  "Retired",
  "Other",
];

const WHAT_MATTERS_OPTIONS = [
  "Career",
  "Money",
  "Family",
  "Relationships",
  "Health",
  "Personal growth",
  "Creativity",
  "Peace of mind",
  "Leadership",
  "Confidence",
  "Productivity",
];

const TRAIT_OPTIONS = [
  "Confidence",
  "Discipline",
  "Focus",
  "Courage",
  "Patience",
  "Leadership",
  "Communication",
  "Creativity",
  "Self-belief",
  "Emotional balance",
  "Consistency",
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, refreshProfile } = useAuth();

  const [name, setName] = useState<string>(userProfile?.name || "");
  const [dob, setDob] = useState<string>(userProfile?.dob || "");
  const [lifeContext, setLifeContext] = useState<string[]>(userProfile?.lifeContext || []);
  const [whatMattersNow, setWhatMattersNow] = useState<string[]>(userProfile?.whatMattersNow || []);
  const [desiredTraits, setDesiredTraits] = useState<string[]>(
    userProfile?.desiredTraits || ["Confidence", "Discipline", "Focus"]
  );
  const [personBecoming, setPersonBecoming] = useState<string>(userProfile?.personBecoming || "");

  // Email check-in settings
  const [emailCheckinEnabled, setEmailCheckinEnabled] = useState<boolean>(
    Boolean(userProfile?.emailCheckinEnabled)
  );
  const [emailCheckinFrequency, setEmailCheckinFrequency] = useState<"daily" | "weekly">(
    userProfile?.emailCheckinFrequency || "daily"
  );
  const [emailCheckinTime, setEmailCheckinTime] = useState<string>(
    userProfile?.emailCheckinTime || "08:00"
  );

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [emailTestStatus, setEmailTestStatus] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleContext = (item: string) => {
    setLifeContext((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleWhatMatters = (item: string) => {
    if (whatMattersNow.includes(item)) {
      setWhatMattersNow(whatMattersNow.filter((i) => i !== item));
    } else {
      if (whatMattersNow.length < 5) {
        setWhatMattersNow([...whatMattersNow, item]);
      }
    }
  };

  const toggleTrait = (item: string) => {
    if (desiredTraits.includes(item)) {
      setDesiredTraits(desiredTraits.filter((t) => t !== item));
    } else {
      if (desiredTraits.length < 3) {
        setDesiredTraits([...desiredTraits, item]);
      }
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (desiredTraits.length !== 3) {
      alert("Please select exactly 3 traits to develop.");
      return;
    }

    setSaving(true);
    try {
      const updated: UserProfile = {
        uid: currentUser.uid,
        name: name.trim() || userProfile?.name || "Reflective User",
        email: currentUser.email || userProfile?.email || "",
        photoURL: currentUser.photoURL || userProfile?.photoURL || "",
        dob: dob || undefined,
        lifeContext,
        whatMattersNow,
        desiredTraits,
        personBecoming:
          personBecoming.trim() ||
          userProfile?.personBecoming ||
          "A more grounded and intentional person",
        emailCheckinEnabled,
        emailCheckinFrequency,
        emailCheckinTime,
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveUserProfile(updated);
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (e) {
      console.error("Failed to update profile:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmailCheckin = async () => {
    if (!currentUser?.email) return;
    setTestingEmail(true);
    setEmailTestStatus(null);
    try {
      const res = await fetch("/api/email-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          checkinEnabled: emailCheckinEnabled,
          frequency: emailCheckinFrequency,
        }),
      });
      const data = await res.json();
      setEmailTestStatus(data.message || "Preference saved.");
    } catch (err: any) {
      setEmailTestStatus("Notification service safely dormant in local mode.");
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FBFBF9] w-full max-w-2xl rounded-3xl border border-[#DCE0D8] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#E8EAE4] flex items-center justify-between bg-white">
          <div>
            <h2 className="font-serif text-2xl text-[#1E201E] font-normal">Edit Profile & Evolution</h2>
            <p className="text-xs text-[#5A605A]">
              Update your context, traits, and trajectory without resetting your reflections.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F2F4F0] text-[#7A807A] hover:text-[#1E201E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-[#2D3A2F] font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#404440] font-medium">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE0D8] bg-white text-sm text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#1E201E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#404440] font-medium">Optional Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE0D8] bg-white text-sm text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#1E201E]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Life Context */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-[#2D3A2F] font-semibold">
              Life Context
            </h3>
            <div className="flex flex-wrap gap-2">
              {LIFE_CONTEXT_OPTIONS.map((item) => {
                const selected = lifeContext.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleContext(item)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? "bg-[#1E201E] text-white border-[#1E201E]"
                        : "bg-white text-[#404440] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: What Matters Now */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-[#2D3A2F] font-semibold">
                What Matters Now
              </h3>
              <span className="text-[11px] text-[#7A807A]">Pick 3 to 5 ({whatMattersNow.length}/5)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {WHAT_MATTERS_OPTIONS.map((item) => {
                const selected = whatMattersNow.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleWhatMatters(item)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? "bg-[#2D3A2F] text-white border-[#2D3A2F]"
                        : "bg-white text-[#404440] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Who You Want to Become (3 Traits) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-[#2D3A2F] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Traits You Want to Develop</span>
              </h3>
              <span className={`text-[11px] font-medium ${desiredTraits.length === 3 ? "text-[#2D3A2F]" : "text-[#A8382F]"}`}>
                Pick exactly 3 ({desiredTraits.length}/3)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRAIT_OPTIONS.map((trait) => {
                const selected = desiredTraits.includes(trait);
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => toggleTrait(trait)}
                    className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? "bg-[#1E201E] text-white border-[#1E201E] shadow-xs"
                        : "bg-white text-[#404440] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                    }`}
                  >
                    {trait}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: The Person You're Becoming */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-[#2D3A2F] font-semibold">
              The Person You're Becoming
            </h3>
            <p className="text-xs text-[#5A605A]">A single line that anchors your daily intentions.</p>
            <input
              type="text"
              value={personBecoming}
              onChange={(e) => setPersonBecoming(e.target.value)}
              placeholder="e.g. Someone who responds with clarity, protects focus, and leads with warmth."
              className="w-full px-4 py-3 rounded-xl border border-[#DCE0D8] bg-white text-sm text-[#1E201E] focus:outline-none focus:ring-1 focus:ring-[#1E201E]"
            />
          </div>

          {/* Section 6: Optional Email Check-in (Opt-In) */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0E4DC] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#2D3A2F]" />
                  <h4 className="text-sm font-medium text-[#1E201E]">Optional Email Check-in</h4>
                </div>
                <p className="text-xs text-[#5A605A] leading-relaxed">
                  Opt-in to a gentle, single-sentence reminder to pause and reflect.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailCheckinEnabled}
                  onChange={(e) => setEmailCheckinEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#E0E4DC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#DCE0D8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D3A2F]"></div>
              </label>
            </div>

            {emailCheckinEnabled && (
              <div className="pt-3 border-t border-[#F0F2ED] space-y-3">
                <div className="p-3 rounded-xl bg-[#F8FAF6] border border-[#E4E8DF] text-xs text-[#383C38] space-y-1.5">
                  <p className="font-semibold text-[#1E201E]">Message Preview:</p>
                  <p className="italic text-[#2D3A2F]">"Take a moment to check in with yourself."</p>
                  <p className="text-[11px] text-[#7A807A] pt-1">
                    Rei never sends or includes your private journal entries in emails. Only this quiet invitation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#404440]">
                    <span>Frequency:</span>
                    <select
                      value={emailCheckinFrequency}
                      onChange={(e) => setEmailCheckinFrequency(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#DCE0D8] bg-white text-xs"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#404440]">
                    <span>Time:</span>
                    <input
                      type="time"
                      value={emailCheckinTime}
                      onChange={(e) => setEmailCheckinTime(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#DCE0D8] bg-white text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestEmailCheckin}
                    disabled={testingEmail}
                    className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-[#DCE0D8] hover:bg-[#F2F4F0] text-[#383C38] transition-colors"
                  >
                    {testingEmail ? "Checking..." : "Verify Setup"}
                  </button>
                </div>

                {emailTestStatus && (
                  <p className="text-[11px] text-[#5A605A] italic bg-[#F2F5EF] p-2 rounded-lg border border-[#DEE2D8]">
                    {emailTestStatus}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-[#E8EAE4] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#5A605A] hover:text-[#1E201E]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] text-white text-sm font-medium transition-all shadow-xs flex items-center gap-2"
          >
            {saving ? (
              <span>Saving Changes...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Profile Updated</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

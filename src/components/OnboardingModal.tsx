import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, Check, Sparkles, User, Heart, Target, Calendar } from "lucide-react";
import { ReiLogo } from "./ReiLogo";

const LIFE_CONTEXTS = [
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

const DESIRED_TRAITS_OPTIONS = [
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

export const OnboardingModal: React.FC = () => {
  const { currentUser, saveProfile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(currentUser?.displayName || "Darshan");
  const [dob, setDob] = useState<string>("");
  const [lifeContext, setLifeContext] = useState<string[]>(["Professional"]);
  const [whatMattersNow, setWhatMattersNow] = useState<string[]>([
    "Personal growth",
    "Peace of mind",
    "Focus",
  ]);
  const [desiredTraits, setDesiredTraits] = useState<string[]>([
    "Confidence",
    "Discipline",
    "Focus",
  ]);
  const [personBecoming, setPersonBecoming] = useState<string>(
    "A grounded creator who builds with steady focus, integrity, and quiet confidence."
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleContext = (item: string) => {
    if (lifeContext.includes(item)) {
      setLifeContext(lifeContext.filter((c) => c !== item));
    } else {
      setLifeContext([...lifeContext, item]);
    }
  };

  const toggleMatters = (item: string) => {
    if (whatMattersNow.includes(item)) {
      setWhatMattersNow(whatMattersNow.filter((m) => m !== item));
    } else {
      if (whatMattersNow.length >= 5) return;
      setWhatMattersNow([...whatMattersNow, item]);
    }
  };

  const toggleTrait = (item: string) => {
    if (desiredTraits.includes(item)) {
      setDesiredTraits(desiredTraits.filter((t) => t !== item));
    } else {
      if (desiredTraits.length >= 3) return;
      setDesiredTraits([...desiredTraits, item]);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && !name.trim()) {
      setError("Please share what we should call you.");
      return;
    }
    if (step === 2 && lifeContext.length === 0) {
      setError("Please select at least one context that fits your current life.");
      return;
    }
    if (step === 3 && (whatMattersNow.length < 3 || whatMattersNow.length > 5)) {
      setError("Please select between 3 and 5 areas that matter most now.");
      return;
    }
    if (step === 4 && desiredTraits.length !== 3) {
      setError("Please pick exactly 3 traits to develop.");
      return;
    }
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!personBecoming.trim()) {
      setError("Please write one line for the person you are becoming.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await saveProfile({
        name: name.trim(),
        dob: dob || undefined,
        lifeContext,
        whatMattersNow,
        desiredTraits,
        personBecoming: personBecoming.trim(),
      });
    } catch (e: any) {
      setError("Could not complete setup. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E201E]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FBFBF9] border border-[#E0E3DD] rounded-2xl max-w-xl w-full p-8 shadow-xl max-h-[90vh] flex flex-col justify-between overflow-y-auto">
        {/* Step Indicator */}
        <div>
          <div className="flex items-center justify-between border-b border-[#ECEEE8] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <ReiLogo size="sm" showWordmark={true} />
              <span className="text-xs text-[#828882]">• Setting your living model</span>
            </div>
            <span className="text-xs font-medium text-[#606460] bg-[#EFEFEA] px-2.5 py-1 rounded-full">
              Step {step} of 5
            </span>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#FAF0EF] border border-[#F0D5D2] text-xs text-[#A8382F]">
              {error}
            </div>
          )}

          {/* STEP 1: Name & Optional DOB */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1E201E] font-normal mb-2">
                  What should we call you?
                </h2>
                <p className="text-sm text-[#606460]">
                  Rei gets to know you through your experiences and reflections.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A605A] mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="onboarding-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Darshan"
                    className="w-full px-4 py-3 rounded-xl border border-[#D5D8D0] bg-white text-base focus:outline-none focus:border-[#2D3A2F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A605A] mb-1.5">
                    Date of Birth <span className="text-[#888E88] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="onboarding-dob-input"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#D5D8D0] bg-white text-sm focus:outline-none focus:border-[#2D3A2F]"
                  />
                  <p className="text-[11px] text-[#828882] mt-1.5">
                    Quietly seeds potential as initial hypotheses only. Never used for astrology or fortune-telling.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Life Context */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1E201E] font-normal mb-2">
                  Where are you in life right now?
                </h2>
                <p className="text-sm text-[#606460]">
                  Select all that describe your current life context.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {LIFE_CONTEXTS.map((item) => {
                  const selected = lifeContext.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleContext(item)}
                      className={`px-4 py-3 rounded-xl border text-sm text-left font-medium transition-all ${
                        selected
                          ? "bg-[#2D3A2F] text-white border-[#2D3A2F]"
                          : "bg-white text-[#383C38] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: What Matters Now */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1E201E] font-normal mb-2">
                  What matters most right now?
                </h2>
                <p className="text-sm text-[#606460]">
                  Pick 3 to 5 focal areas shaping your energy today ({whatMattersNow.length}/5 selected).
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {WHAT_MATTERS_OPTIONS.map((item) => {
                  const selected = whatMattersNow.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMatters(item)}
                      className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                        selected
                          ? "bg-[#2D3A2F] text-white border-[#2D3A2F]"
                          : "bg-white text-[#383C38] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: 3 Desired Traits */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1E201E] font-normal mb-2">
                  Who do you want to become?
                </h2>
                <p className="text-sm text-[#606460]">
                  Choose exactly 3 traits you want to cultivate and track in your living model ({desiredTraits.length}/3 selected).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DESIRED_TRAITS_OPTIONS.map((item) => {
                  const selected = desiredTraits.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleTrait(item)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                        selected
                          ? "bg-[#2D3A2F] text-white border-[#2D3A2F]"
                          : "bg-white text-[#383C38] border-[#DCE0D8] hover:bg-[#F2F4F0]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item}</span>
                        {selected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: One Line on the Person Becoming */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1E201E] font-normal mb-2">
                  The person you're becoming
                </h2>
                <p className="text-sm text-[#606460]">
                  Capture in one clear sentence how you aspire to live, act, and show up.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  id="onboarding-person-becoming-input"
                  rows={4}
                  value={personBecoming}
                  onChange={(e) => setPersonBecoming(e.target.value)}
                  placeholder="e.g. Someone who speaks with calm certainty, listens completely, and follows through on commitments."
                  className="w-full px-4 py-3 rounded-xl border border-[#D5D8D0] bg-white text-base focus:outline-none focus:border-[#2D3A2F] leading-relaxed"
                />
                <p className="text-xs text-[#828882]">
                  This anchors your daily check-in questions and reflection signals.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 pt-4 border-t border-[#ECEEE8] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg text-sm text-[#606460] hover:text-[#1E201E]"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            id="onboarding-next-btn"
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] text-white text-sm font-medium transition-all"
          >
            <span>
              {isSubmitting ? "Saving..." : step === 5 ? "Enter Rei" : "Continue"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

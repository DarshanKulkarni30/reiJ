import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Mood, JournalInteraction, EntryLocation } from "../types";
import { saveJournalInteraction } from "../lib/storage";
import {
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  Feather,
  ArrowRight,
  MapPin,
  Camera,
  Image as ImageIcon,
  X,
  Compass,
  Upload,
} from "lucide-react";

interface TodayViewProps {
  onEntrySaved?: (entry: JournalInteraction) => void;
  goToJournal?: () => void;
}

const MOOD_OPTIONS: { mood: Mood; label: string; upliftingNote: string; dotColor: string }[] = [
  { mood: "Grounded", label: "Grounded", upliftingNote: "Centered, steady, clear", dotColor: "#1C6E41" },
  { mood: "Quiet", label: "Quiet", upliftingNote: "Soft presence, gentle stillness", dotColor: "#0D9488" },
  { mood: "Reflective", label: "Reflective", upliftingNote: "Contemplative, observant", dotColor: "#0284C7" },
  { mood: "Searching", label: "Searching", upliftingNote: "Seeking clarity and insight", dotColor: "#6366F1" },
  { mood: "Determined", label: "Determined", upliftingNote: "Focused, committed intention", dotColor: "#C2410C" },
  { mood: "Energized", label: "Energized", upliftingNote: "Vibrant, forward-moving", dotColor: "#D97706" },
  { mood: "Heavy", label: "Heavy", upliftingNote: "Holding weight — safe to release here", dotColor: "#C8542B" },
];

export const TodayView: React.FC<TodayViewProps> = ({ onEntrySaved, goToJournal }) => {
  const { currentUser, userProfile } = useAuth();
  const { reportMood, isAuto, activeTheme } = useTheme();

  const todayDateStr = new Date().toISOString().split("T")[0];
  const formattedToday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [mood, setMood] = useState<Mood>("Grounded");
  const [intention, setIntention] = useState<string>("");
  const [promptQuestion, setPromptQuestion] = useState<string>("How do you want to show up today?");
  const [promptLoading, setPromptLoading] = useState<boolean>(false);
  const [freeWrite, setFreeWrite] = useState<string>("");
  const [eveningClose, setEveningClose] = useState<string>("");
  const [showEveningClose, setShowEveningClose] = useState<boolean>(false);

  // Location pinning state (Opt-in per entry only; no background tracking)
  const [mapsConfigured, setMapsConfigured] = useState<boolean>(false);
  const [pinnedLocation, setPinnedLocation] = useState<EntryLocation | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [locationSearchResults, setLocationSearchResults] = useState<EntryLocation[]>([]);
  const [searchingLocation, setSearchingLocation] = useState<boolean>(false);
  const [locatingGPS, setLocatingGPS] = useState<boolean>(false);

  // Photo attachment state (EXIF-stripped client side; 5MB limit)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>("");
  const [processingPhoto, setProcessingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<JournalInteraction | null>(null);

  // Sync mood with theme system on initial mount and change
  useEffect(() => {
    reportMood(mood);
  }, [mood, reportMood]);

  // Check if Google Maps is configured on the server
  useEffect(() => {
    fetch("/api/maps/status")
      .then((res) => res.json())
      .then((data) => {
        setMapsConfigured(Boolean(data?.mapsConfigured));
      })
      .catch(() => {
        setMapsConfigured(false);
      });
  }, []);

  // Fetch daily personalized prompt (cached per day in sessionStorage)
  useEffect(() => {
    if (!userProfile) return;

    const todayDateStr = new Date().toISOString().split("T")[0];
    const cacheKey = `rei_daily_prompt_${todayDateStr}_${(userProfile.desiredTraits || []).join("_")}`;

    // Instant load from sessionStorage if available
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.prompt) {
          setPromptQuestion(parsed.prompt);
          return;
        }
      }
    } catch (_) {}

    let isMounted = true;
    async function loadDailyPrompt() {
      if (!userProfile) return;
      setPromptLoading(true);
      try {
        const res = await fetch("/api/daily-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userProfile.uid,
          },
          body: JSON.stringify({
            traits: userProfile.desiredTraits,
            personBecoming: userProfile.personBecoming,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.prompt && isMounted) {
            setPromptQuestion(data.prompt);
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify({ prompt: data.prompt, focusTrait: data.focusTrait }));
            } catch (_) {}
          }
        }
      } catch (e) {
        if (isMounted) {
          setPromptQuestion("How do you want to show up today?");
        }
      } finally {
        if (isMounted) {
          setPromptLoading(false);
        }
      }
    }
    loadDailyPrompt();

    return () => {
      isMounted = false;
    };
  }, [userProfile?.uid, userProfile?.personBecoming, (userProfile?.desiredTraits || []).join(",")]);

  const handleSelectMood = (newMood: Mood) => {
    setMood(newMood);
    reportMood(newMood);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/places/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const placeName = data.location?.name || data.name || `Location (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`;
            const formattedAddress = data.location?.formattedAddress || data.address || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            setPinnedLocation({
              name: placeName,
              formattedAddress,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              source: "gps",
            });
            setShowLocationPicker(false);
          } else {
            setPinnedLocation({
              name: `Location (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`,
              formattedAddress: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              source: "gps",
            });
            setShowLocationPicker(false);
          }
        } catch (_) {
          // Graceful fallback to coordinates without throwing errors
          setPinnedLocation({
            name: `Location (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`,
            formattedAddress: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: "gps",
          });
          setShowLocationPicker(false);
        } finally {
          setLocatingGPS(false);
        }
      },
      (_) => {
        setLocatingGPS(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSearchPlaces = async (query: string) => {
    setLocationQuery(query);
    if (!query.trim()) {
      setLocationSearchResults([]);
      return;
    }
    setSearchingLocation(true);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setLocationSearchResults(data.results);
        }
      }
    } catch (_) {
      // Graceful silence for transient place search hiccups
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSelectPlace = (place: EntryLocation) => {
    setPinnedLocation(place);
    setShowLocationPicker(false);
    setLocationQuery("");
    setLocationSearchResults([]);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select a photo smaller than 5MB.");
      return;
    }

    setProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Strip EXIF metadata completely via HTML5 Canvas draw
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Strip EXIF metadata completely unless user pinned a place
          const cleanDataUrl = canvas.toDataURL("image/jpeg", 0.85);

          // Upload to server-side uid-isolated Cloud Storage endpoint
          (async () => {
            try {
              const token = typeof currentUser?.getIdToken === "function" ? await currentUser.getIdToken() : "";
              const uploadRes = await fetch("/api/upload-photo", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token || ""}`,
                  "x-user-id": currentUser?.uid || "",
                },
                body: JSON.stringify({
                  imageBase64: cleanDataUrl,
                  mimeType: "image/jpeg",
                  hasPinnedPlace: Boolean(pinnedLocation),
                  locationName: pinnedLocation?.name,
                }),
              });
              if (uploadRes.ok) {
                const data = await uploadRes.json();
                setPhotoUrl(data.photoUrl || cleanDataUrl);
              } else {
                setPhotoUrl(cleanDataUrl);
              }
            } catch (_) {
              setPhotoUrl(cleanDataUrl);
            } finally {
              setProcessingPhoto(false);
            }
          })();
        } else {
          setProcessingPhoto(false);
        }
      };
      img.onerror = () => setProcessingPhoto(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setProcessingPhoto(false);
    reader.readAsDataURL(file);
  };

  const handleSaveAndReflect = async () => {
    if (!currentUser || !userProfile) return;
    if (!freeWrite.trim()) {
      setSaveError("Please write a few thoughts before saving.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const entryId = `entry_${Date.now()}`;
    const now = new Date();

    try {
      const token = typeof currentUser?.getIdToken === "function" ? await currentUser.getIdToken() : "";
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
          "x-user-id": currentUser.uid,
        },
        body: JSON.stringify({
          text: freeWrite.trim(),
          mood,
          intention: intention.trim(),
          promptQuestion,
          eveningClose: eveningClose.trim() || undefined,
          traits: userProfile.desiredTraits,
          personBecoming: userProfile.personBecoming,
          location: pinnedLocation || undefined,
          hasPhoto: Boolean(photoUrl),
          photoCaption: photoCaption.trim() || undefined,
          notifications: userProfile.notifications,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Reflection failed (${response.status})`);
      }

      const reflectData = await response.json();

      const fullInteraction: JournalInteraction = {
        id: entryId,
        userId: currentUser.uid,
        date: todayDateStr,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mood,
        intention: intention.trim(),
        promptQuestion,
        freeWrite: freeWrite.trim(),
        eveningClose: eveningClose.trim() || undefined,
        location: pinnedLocation || undefined,
        photoUrl: photoUrl || undefined,
        photoCaption: photoCaption.trim() || undefined,
        emotion: reflectData.emotion,
        theme: reflectData.theme,
        behavior: reflectData.behavior,
        relatedTrait: reflectData.relatedTrait,
        intensity: reflectData.intensity,
        reflectionQuestion: reflectData.reflectionQuestion,
        growthSignal: reflectData.growthSignal,
        createdAt: now.toISOString(),
      };

      await saveJournalInteraction(currentUser.uid, fullInteraction);

      setSavedResult(fullInteraction);
      if (onEntrySaved) {
        onEntrySaved(fullInteraction);
      }
    } catch (err: any) {
      console.error("[Save Error]:", err);
      setSaveError(err.message || "Failed to save entry. Your draft is preserved below.");
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = freeWrite.trim() ? freeWrite.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Date & Subdued Greeting */}
      <div className="space-y-1.5 border-b border-[var(--color-border-subtle,#E6EFE8)] pb-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted,#677D6D)] font-semibold">
            {formattedToday}
          </p>
          {isAuto && (
            <span className="text-[11px] text-[var(--color-accent,#1C6E41)] bg-[var(--color-accent-subtle,#E3F2E8)] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Theme synced with mood</span>
            </span>
          )}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-text-primary,#152419)] font-normal tracking-tight">
          How do you want to show up today?
        </h1>
        <p className="text-sm text-[var(--color-text-secondary,#405746)] font-light">
          Bring whatever is true right now. Rei will reflect with you.
        </p>
      </div>

      {/* If newly saved, show Rei's reflection response */}
      {savedResult ? (
        <div className="p-8 rounded-3xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] space-y-6 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle,#E6EFE8)] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent,#1C6E41)]"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#152419)]">
                Something we've noticed
              </span>
            </div>
            <span className="text-xs text-[var(--color-text-muted,#677D6D)]">Saved to your journal</span>
          </div>

          {/* Rei's Single Next Question */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted,#677D6D)]">
              A question for you
            </p>
            <p className="font-serif text-xl sm:text-2xl text-[var(--color-text-primary,#152419)] font-normal leading-snug">
              "{savedResult.reflectionQuestion}"
            </p>
          </div>

          {/* Grounded Growth Signal */}
          {savedResult.growthSignal && (
            <div className="p-4 rounded-2xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] text-sm text-[var(--color-text-primary,#152419)] leading-relaxed">
              <span className="font-semibold text-[var(--color-accent,#1C6E41)]">Your growth: </span>
              {savedResult.growthSignal}
            </div>
          )}

          {/* Attached Place and Photo in Saved View */}
          {(savedResult.location || savedResult.photoUrl) && (
            <div className="p-4 rounded-2xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] space-y-3">
              {savedResult.location && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary,#152419)] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                  <span>
                    {savedResult.location.name}
                    {savedResult.location.formattedAddress ? ` · ${savedResult.location.formattedAddress}` : ""}
                  </span>
                </div>
              )}

              {savedResult.photoUrl && (
                <div className="flex items-start gap-3">
                  <img
                    src={savedResult.photoUrl}
                    alt="Attached memory"
                    className="w-20 h-20 object-cover rounded-xl border border-[var(--color-border-subtle,#E6EFE8)]"
                    referrerPolicy="no-referrer"
                  />
                  {savedResult.photoCaption && (
                    <p className="text-xs text-[var(--color-text-secondary,#405746)] italic pt-1">
                      "{savedResult.photoCaption}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Internal Signals */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            {savedResult.emotion && (
              <span className="px-3 py-1 rounded-full bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] text-[var(--color-text-secondary,#405746)]">
                Tone: {savedResult.emotion}
              </span>
            )}
            {savedResult.relatedTrait && (
              <span className="px-3 py-1 rounded-full bg-[var(--color-accent-subtle,#E3F2E8)] text-[var(--color-accent,#1C6E41)] font-medium border border-[var(--color-border-subtle,#E6EFE8)]">
                Trait: {savedResult.relatedTrait}
              </span>
            )}
            {savedResult.theme && (
              <span className="px-3 py-1 rounded-full bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] text-[var(--color-text-secondary,#405746)]">
                Theme: {savedResult.theme}
              </span>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border-subtle,#E6EFE8)]">
            <button
              onClick={() => {
                setSavedResult(null);
                setFreeWrite("");
                setIntention("");
                setEveningClose("");
              }}
              className="text-xs text-[var(--color-text-secondary,#405746)] hover:text-[var(--color-text-primary,#152419)] underline cursor-pointer"
            >
              Write another reflection
            </button>

            {goToJournal && (
              <button
                onClick={goToJournal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)] text-xs font-medium hover:bg-[var(--color-accent-hover,#145532)] transition-all shadow-xs"
              >
                <span>View in Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* The Active Journaling Form */
        <div className="space-y-8">
          {/* Mood Check with Uplifting Response */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary,#405746)]">
                Current State
              </label>
              <span className="text-[11px] text-[var(--color-text-muted,#677D6D)]">
                {MOOD_OPTIONS.find((m) => m.mood === mood)?.upliftingNote}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((item) => {
                const selected = mood === item.mood;
                return (
                  <button
                    key={item.mood}
                    type="button"
                    onClick={() => handleSelectMood(item.mood)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      selected
                        ? "bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)] border-[var(--color-accent,#1C6E41)] shadow-xs scale-105"
                        : "bg-[var(--color-bg-surface,#FFFFFF)] text-[var(--color-text-secondary,#405746)] border-[var(--color-border,#D4E3D7)] hover:bg-[var(--color-bg-subtle,#ECF4EC)]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 transition-transform"
                      style={{ backgroundColor: selected ? "#FFFFFF" : item.dotColor }}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Intention */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary,#405746)]">
              Today's Intention
            </label>
            <input
              id="today-intention-input"
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="What quality or commitment will you carry into today?"
              className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] text-sm text-[var(--color-text-primary,#152419)] focus:outline-none focus:border-[var(--color-accent,#1C6E41)] focus:ring-1 focus:ring-[var(--color-accent,#1C6E41)]"
            />
          </div>

          {/* Today's Question for You */}
          <div className="p-5 rounded-2xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-accent,#1C6E41)] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>A question for you</span>
              </span>
              {promptLoading && (
                <span className="text-[10px] text-[var(--color-text-muted,#677D6D)] animate-pulse">
                  Personalizing...
                </span>
              )}
            </div>
            <p className="font-serif text-lg sm:text-xl text-[var(--color-text-primary,#152419)] font-normal leading-relaxed">
              "{promptQuestion}"
            </p>
          </div>

          {/* Free Write Journal Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary,#405746)]">
                Journal
              </label>
              <span className="text-xs text-[var(--color-text-muted,#677D6D)]">{wordCount} words</span>
            </div>
            <textarea
              id="today-freewrite-textarea"
              rows={8}
              value={freeWrite}
              onChange={(e) => setFreeWrite(e.target.value)}
              placeholder="Speak candidly about what happened, what you felt, or where you hesitated. Rei learns from your words..."
              className="w-full p-4 rounded-2xl border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] text-base text-[var(--color-text-primary,#152419)] leading-relaxed focus:outline-none focus:border-[var(--color-accent,#1C6E41)] focus:ring-1 focus:ring-[var(--color-accent,#1C6E41)]"
            />

            {/* Entry Attachments: Location Pin & Photo (Strict Privacy, Opt-In) */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Location trigger - only rendered if Google Maps is configured on the server */}
                {mapsConfigured && (
                  !pinnedLocation ? (
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] text-xs text-[var(--color-text-secondary,#405746)] hover:bg-[var(--color-bg-subtle,#ECF4EC)] transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                      <span>Pin a place (Optional)</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-subtle,#E3F2E8)] text-[var(--color-accent,#1C6E41)] border border-[var(--color-border-subtle,#E6EFE8)] text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{pinnedLocation.name || pinnedLocation.formattedAddress}</span>
                      <button
                        type="button"
                        onClick={() => setPinnedLocation(null)}
                        className="hover:opacity-75 p-0.5 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                )}

                {/* Photo trigger */}
                {!photoUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] text-xs text-[var(--color-text-secondary,#405746)] hover:bg-[var(--color-bg-subtle,#ECF4EC)] transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                      <span>{processingPhoto ? "Processing..." : "Attach photo (Optional)"}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-subtle,#E3F2E8)] text-[var(--color-accent,#1C6E41)] border border-[var(--color-border-subtle,#E6EFE8)] text-xs font-medium">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photo attached (EXIF stripped)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl(null);
                        setPhotoCaption("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="hover:opacity-75 p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Location reflection prompt cue */}
              {pinnedLocation && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] text-xs text-[var(--color-text-secondary,#405746)] animate-in fade-in duration-200">
                  <Compass className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)] shrink-0" />
                  <span>
                    How did being at <strong>{pinnedLocation.name || pinnedLocation.formattedAddress}</strong> feel while you were writing this?
                  </span>
                </div>
              )}

              {/* Location Picker Popover/Panel */}
              {showLocationPicker && !pinnedLocation && (
                <div className="p-4 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary,#405746)]">
                      <Compass className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                      <span>Pin Location for this Entry</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(false)}
                      className="text-xs text-[var(--color-text-muted,#677D6D)] hover:text-[var(--color-text-primary,#152419)]"
                    >
                      Close
                    </button>
                  </div>

                  <p className="text-[11px] text-[var(--color-text-muted,#677D6D)]">
                    Rei never tracks you in the background. Location is saved only on this entry, and coordinates are never used to infer health or wellbeing.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => handleSearchPlaces(e.target.value)}
                      placeholder="Search park, cafe, quiet library, or city..."
                      className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] text-xs text-[var(--color-text-primary,#152419)] focus:outline-none focus:border-[var(--color-accent,#1C6E41)]"
                    />
                    <button
                      type="button"
                      onClick={handleUseGPS}
                      disabled={locatingGPS}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-subtle,#ECF4EC)] text-xs font-medium text-[var(--color-text-secondary,#405746)] hover:bg-[var(--color-border-subtle,#E6EFE8)] transition-colors whitespace-nowrap"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                      <span>{locatingGPS ? "Locating..." : "Use GPS"}</span>
                    </button>
                  </div>

                  {searchingLocation && (
                    <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] animate-pulse">
                      Searching serene places...
                    </p>
                  )}

                  {locationSearchResults.length > 0 && (
                    <div className="space-y-1 max-h-36 overflow-y-auto border-t border-[var(--color-border-subtle,#E6EFE8)] pt-2">
                      {locationSearchResults.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="w-full text-left p-2 rounded-lg hover:bg-[var(--color-bg-subtle,#ECF4EC)] flex items-center justify-between text-xs text-[var(--color-text-primary,#152419)] transition-colors"
                        >
                          <span className="font-medium">{place.name}</span>
                          <span className="text-[10px] text-[var(--color-text-muted,#677D6D)]">
                            {place.formattedAddress}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Peaceful presets */}
                  <div className="pt-2 border-t border-[var(--color-border-subtle,#E6EFE8)]">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted,#677D6D)] mb-1.5">
                      Suggested settings
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: "Quiet Morning Walk", address: "Local trail" },
                        { name: "Home Study", address: "Private space" },
                        { name: "Local Library", address: "Quiet study" },
                        { name: "Park Bench", address: "Nature reflection" },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            handleSelectPlace({
                              name: preset.name,
                              formattedAddress: preset.address,
                              source: "manual",
                            })
                          }
                          className="px-2 py-1 rounded-md bg-[var(--color-bg-subtle,#ECF4EC)] text-[11px] text-[var(--color-text-secondary,#405746)] hover:bg-[var(--color-border-subtle,#E6EFE8)] transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Preview Thumbnail & Caption */}
              {photoUrl && (
                <div className="p-3 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] flex flex-col sm:flex-row gap-4 items-start animate-in fade-in duration-200">
                  <div className="relative group shrink-0">
                    <img
                      src={photoUrl}
                      alt="Attached reflection"
                      className="w-24 h-24 object-cover rounded-xl border border-[var(--color-border-subtle,#E6EFE8)]"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl(null);
                        setPhotoCaption("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#152419] text-white flex items-center justify-center text-xs shadow-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-text-secondary,#405746)]">
                      Photo Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="What drew your attention to this moment?"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] text-xs text-[var(--color-text-primary,#152419)] focus:outline-none focus:border-[var(--color-accent,#1C6E41)]"
                    />
                    <p className="text-[10px] text-[var(--color-text-muted,#677D6D)]">
                      EXIF data and camera location have been stripped on-device to preserve your absolute privacy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Evening Close Accordion */}
          <div className="border-t border-[var(--color-border-subtle,#E6EFE8)] pt-4">
            {!showEveningClose ? (
              <button
                type="button"
                onClick={() => setShowEveningClose(true)}
                className="text-xs text-[var(--color-text-secondary,#405746)] hover:text-[var(--color-text-primary,#152419)] font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>+ Add an optional evening close</span>
              </button>
            ) : (
              <div className="space-y-2 p-4 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary,#405746)]">
                    Evening Close
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEveningClose(false)}
                    className="text-[11px] text-[var(--color-text-muted,#677D6D)] hover:text-[var(--color-text-primary,#152419)]"
                  >
                    Hide
                  </button>
                </div>
                <textarea
                  id="today-evening-close-textarea"
                  rows={3}
                  value={eveningClose}
                  onChange={(e) => setEveningClose(e.target.value)}
                  placeholder="Looking back on the day: What surprised you, tested your intentions, or shifted your view?"
                  className="w-full p-3 rounded-xl border border-[var(--color-border-subtle,#E6EFE8)] bg-[var(--color-bg-subtle,#ECF4EC)] text-sm text-[var(--color-text-primary,#152419)] focus:outline-none focus:border-[var(--color-accent,#1C6E41)]"
                />
              </div>
            )}
          </div>

          {/* Error Notice with Retry Save */}
          {saveError && (
            <div className="p-4 rounded-2xl bg-[#FAF0EF] border border-[#F0D5D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#A8382F]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
              <button
                id="retry-save-btn"
                type="button"
                onClick={handleSaveAndReflect}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-lg bg-[#A8382F] text-white font-medium hover:bg-[#8F2E26] shrink-0 active:scale-95 transition-all"
              >
                Retry Save
              </button>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[var(--color-text-muted,#677D6D)]">
              Saved securely to your private personal model
            </span>
            <button
              id="today-save-reflect-btn"
              type="button"
              onClick={handleSaveAndReflect}
              disabled={isSaving || !freeWrite.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-accent,#1C6E41)] hover:bg-[var(--color-accent-hover,#145532)] disabled:opacity-50 text-[var(--color-accent-contrast,#FFFFFF)] text-sm font-medium transition-all shadow-xs active:scale-[0.985]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reflecting...</span>
                </>
              ) : (
                <>
                  <Feather className="w-4 h-4" />
                  <span>Save & Reflect</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

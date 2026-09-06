export type Mood =
  | "Grounded"
  | "Reflective"
  | "Energized"
  | "Searching"
  | "Heavy"
  | "Quiet"
  | "Determined";

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  dob?: string;
  lifeContext: string[];
  whatMattersNow: string[];
  desiredTraits: string[];
  personBecoming: string;
  emailCheckinEnabled?: boolean;
  emailCheckinTime?: string;
  emailCheckinFrequency?: "daily" | "weekly";
  createdAt: string;
  updatedAt: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string;
  mood?: Mood;
  intention?: string;
  promptQuestion?: string;
  freeWrite: string;
  eveningClose?: string;

  // Rei internal signals (persisted with entry)
  emotion?: string;
  theme?: string;
  behavior?: string;
  relatedTrait?: string;
  intensity?: number;
  reflectionQuestion?: string;
  growthSignal?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface PracticeRecord {
  id: string;
  userId: string;
  trait: string;
  behavior: string;
  practicePrompt: string;
  status: "active" | "reflected";
  whatHappened?: string;
  savedEvidence?: string;
  reflectionQuestion?: string;
  createdAt: string;
  reflectedAt?: string;
}

export interface PatternInsight {
  id: string;
  theme: string;
  patternSummary: string;
  occurrenceCount: number;
  dates: string[];
  entryIds: string[];
  evidenceQuotes: { date: string; quote: string; entryId: string }[];
  followUpQuestion: string;
  userReflection?: string;
  createdAt: string;
}

export interface TraitModel {
  trait: string;
  potential: string;
  observed: string;
  desired: string;
  evidenceQuotes?: string[];
  evidenceDetails?: { date: string; quote: string; signal: string }[];
  practices?: string[];
  updatedAt?: string;
}

export interface WeeklyNote {
  id: string;
  userId: string;
  weekLabel: string;
  themes: string[];
  growthSignal: string;
  nextWeekFocus: string;
  entryCount: number;
  createdAt: string;
}

export type ActiveTab = "today" | "journal" | "journey" | "reflect" | "patterns" | "grow" | "model";

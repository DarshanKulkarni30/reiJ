export type Mood =
  | "Grounded"
  | "Reflective"
  | "Energized"
  | "Searching"
  | "Heavy"
  | "Quiet"
  | "Determined";

export interface EntryLocation {
  name: string;
  lat?: number;
  lng?: number;
  address?: string;
  formattedAddress?: string;
  source?: "gps" | "manual";
}

export interface NotificationSettings {
  email?: boolean;
  slack?: boolean;
  discord?: boolean;
  emailEnabled?: boolean;
  slackEnabled?: boolean;
  discordEnabled?: boolean;
  slackWebhook?: string;
  slackWebhookUrl?: string;
  discordWebhook?: string;
  discordWebhookUrl?: string;
  frequency?: "daily" | "weekly" | "practice";
  time?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  dob?: string;
  role?: "user" | "admin";
  lifeContext: string[];
  whatMattersNow: string[];
  desiredTraits: string[];
  personBecoming: string;
  emailCheckinEnabled?: boolean;
  emailCheckinTime?: string;
  emailCheckinFrequency?: "daily" | "weekly";
  notifications?: NotificationSettings;
  themeMode?: "auto" | "manual";
  themePreference?: string;
  createdAt: string;
  updatedAt: string;
}

export type ThemeName = "dawn" | "grove" | "serene" | "harbor" | "iris" | "ember" | "solis" | "nightbloom";
export type ThemeMode = "auto" | "manual";

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

  // Challenge extras: Location & Photo
  location?: EntryLocation;
  photoUrl?: string;
  photoCaption?: string;

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

export interface AdminMetrics {
  totalUsers: number;
  totalEntriesToday: number;
  totalInteractions: number;
  systemHealth: {
    status: "healthy" | "degraded" | "operational";
    uptimeSeconds: number;
    hasGeminiKey: boolean;
    hasMapsKey: boolean;
    hasSlackWebhook: boolean;
    hasDiscordWebhook: boolean;
    hasEmailConfig: boolean;
    activeModelCooldowns: string[];
    modelsStatus: { model: string; state: "ready" | "cooling_down" }[];
  };
}

export type ActiveTab = "today" | "journal" | "journey" | "reflect" | "patterns" | "grow" | "model" | "admin";

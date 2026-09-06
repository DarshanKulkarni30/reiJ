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

export interface TraitModel {
  trait: string;
  potential: string;
  observed: string;
  desired: string;
  evidenceQuotes?: string[];
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

export type ActiveTab = "today" | "journal" | "reflect" | "grow" | "model";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth, isConfigured, handleFirestoreError, OperationType } from "./firebase";
import { UserProfile, JournalInteraction, TraitModel, WeeklyNote, PracticeRecord, PatternInsight } from "../types";

// Local storage fallback helpers
function getLocalKey(userId: string, subkey: string): string {
  return `rei_${userId}_${subkey}`;
}

// -------------------------------------------------------------
// USER PROFILE
// -------------------------------------------------------------
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  if (isConfigured && db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        localStorage.setItem(getLocalKey(userId, "profile"), JSON.stringify(data));
        return data;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path, auth);
    }
  }

  // Local fallback
  const raw = localStorage.getItem(getLocalKey(userId, "profile"));
  return raw ? JSON.parse(raw) : null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  // Always update local cache
  localStorage.setItem(getLocalKey(profile.uid, "profile"), JSON.stringify(profile));

  if (isConfigured && db) {
    try {
      const docRef = doc(db, "users", profile.uid);
      await setDoc(docRef, {
        ...profile,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path, auth);
    }
  }
}

// -------------------------------------------------------------
// JOURNAL INTERACTIONS
// -------------------------------------------------------------
export async function getJournalInteractions(userId: string): Promise<JournalInteraction[]> {
  const path = `users/${userId}/interactions`;
  if (isConfigured && db) {
    try {
      const collRef = collection(db, "users", userId, "interactions");
      const q = query(collRef, orderBy("createdAt", "desc"));
      const querySnap = await getDocs(q);
      const list: JournalInteraction[] = [];
      querySnap.forEach((doc) => {
        list.push({ id: doc.id, ...(doc.data() as any) });
      });
      localStorage.setItem(getLocalKey(userId, "entries"), JSON.stringify(list));
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path, auth);
    }
  }

  // Local fallback
  const raw = localStorage.getItem(getLocalKey(userId, "entries"));
  return raw ? JSON.parse(raw) : [];
}

export async function saveJournalInteraction(
  userId: string,
  entry: JournalInteraction
): Promise<void> {
  const path = `users/${userId}/interactions/${entry.id}`;

  // Update local cache first
  const existing = await getJournalInteractions(userId);
  const index = existing.findIndex((e) => e.id === entry.id);
  let updatedList: JournalInteraction[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = entry;
  } else {
    updatedList = [entry, ...existing];
  }
  localStorage.setItem(getLocalKey(userId, "entries"), JSON.stringify(updatedList));

  if (isConfigured && db) {
    try {
      const docRef = doc(db, "users", userId, "interactions", entry.id);
      await setDoc(docRef, {
        ...entry,
        userId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path, auth);
    }
  }
}

// -------------------------------------------------------------
// LIVING MODEL (Potential | Observed | Desired)
// -------------------------------------------------------------
export async function getTraitModels(userId: string): Promise<TraitModel[]> {
  const path = `users/${userId}/model`;
  if (isConfigured && db) {
    try {
      const collRef = collection(db, "users", userId, "model");
      const querySnap = await getDocs(collRef);
      const list: TraitModel[] = [];
      querySnap.forEach((doc) => {
        list.push(doc.data() as TraitModel);
      });
      if (list.length > 0) {
        localStorage.setItem(getLocalKey(userId, "model"), JSON.stringify(list));
        return list;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path, auth);
    }
  }

  const raw = localStorage.getItem(getLocalKey(userId, "model"));
  return raw ? JSON.parse(raw) : [];
}

export async function saveTraitModel(userId: string, model: TraitModel): Promise<void> {
  const traitId = encodeURIComponent(model.trait.toLowerCase());
  const path = `users/${userId}/model/${traitId}`;

  // Local update
  const existing = await getTraitModels(userId);
  const index = existing.findIndex((m) => m.trait.toLowerCase() === model.trait.toLowerCase());
  let updatedList: TraitModel[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = model;
  } else {
    updatedList = [...existing, model];
  }
  localStorage.setItem(getLocalKey(userId, "model"), JSON.stringify(updatedList));

  if (isConfigured && db) {
    try {
      const docRef = doc(db, "users", userId, "model", traitId);
      await setDoc(docRef, {
        ...model,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path, auth);
    }
  }
}

// -------------------------------------------------------------
// WEEKLY NOTES
// -------------------------------------------------------------
export async function getWeeklyNotes(userId: string): Promise<WeeklyNote[]> {
  const path = `users/${userId}/weekly_notes`;
  if (isConfigured && db) {
    try {
      const collRef = collection(db, "users", userId, "weekly_notes");
      const q = query(collRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: WeeklyNote[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...(doc.data() as any) }));
      localStorage.setItem(getLocalKey(userId, "weekly_notes"), JSON.stringify(list));
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path, auth);
    }
  }

  const raw = localStorage.getItem(getLocalKey(userId, "weekly_notes"));
  return raw ? JSON.parse(raw) : [];
}

export async function saveWeeklyNote(userId: string, note: WeeklyNote): Promise<void> {
  const path = `users/${userId}/weekly_notes/${note.id}`;

  const existing = await getWeeklyNotes(userId);
  const updated = [note, ...existing.filter((n) => n.id !== note.id)];
  localStorage.setItem(getLocalKey(userId, "weekly_notes"), JSON.stringify(updated));

  if (isConfigured && db) {
    try {
      const docRef = doc(db, "users", userId, "weekly_notes", note.id);
      await setDoc(docRef, {
        ...note,
        userId,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path, auth);
    }
  }
}

// -------------------------------------------------------------
// PRACTICE LOOP (Grow: Behaviors, Next Visit Follow-up & Evidence)
// -------------------------------------------------------------
export async function getPractices(userId: string): Promise<PracticeRecord[]> {
  const path = `users/${userId}/practices`;
  if (isConfigured && db) {
    try {
      const collRef = collection(db, "users", userId, "practices");
      const q = query(collRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: PracticeRecord[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...(doc.data() as any) }));
      localStorage.setItem(getLocalKey(userId, "practices"), JSON.stringify(list));
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path, auth);
    }
  }

  const raw = localStorage.getItem(getLocalKey(userId, "practices"));
  return raw ? JSON.parse(raw) : [];
}

export async function savePractice(userId: string, practice: PracticeRecord): Promise<void> {
  const path = `users/${userId}/practices/${practice.id}`;

  const existing = await getPractices(userId);
  const index = existing.findIndex((p) => p.id === practice.id);
  let updatedList: PracticeRecord[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = practice;
  } else {
    updatedList = [practice, ...existing];
  }
  localStorage.setItem(getLocalKey(userId, "practices"), JSON.stringify(updatedList));

  if (isConfigured && db) {
    try {
      const docRef = doc(db, "users", userId, "practices", practice.id);
      await setDoc(docRef, {
        ...practice,
        userId,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path, auth);
    }
  }
}

// -------------------------------------------------------------
// PATTERNS (Connecting Similar Past Entries for this user only)
// -------------------------------------------------------------
export async function getPatternInsights(userId: string): Promise<PatternInsight[]> {
  const path = `users/${userId}/patterns`;
  if (isConfigured && db) {
    try {
      const collRef = collection(db, "users", userId, "patterns");
      const q = query(collRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: PatternInsight[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...(doc.data() as any) }));
      localStorage.setItem(getLocalKey(userId, "patterns"), JSON.stringify(list));
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path, auth);
    }
  }

  const raw = localStorage.getItem(getLocalKey(userId, "patterns"));
  return raw ? JSON.parse(raw) : [];
}

export async function savePatternInsight(userId: string, pattern: PatternInsight): Promise<void> {
  const path = `users/${userId}/patterns/${pattern.id}`;

  const existing = await getPatternInsights(userId);
  const index = existing.findIndex((p) => p.id === pattern.id);
  let updatedList: PatternInsight[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = pattern;
  } else {
    updatedList = [pattern, ...existing];
  }
  localStorage.setItem(getLocalKey(userId, "patterns"), JSON.stringify(updatedList));

  if (isConfigured && db) {
    try {
      const docRef = doc(db, "users", userId, "patterns", pattern.id);
      await setDoc(docRef, {
        ...pattern,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path, auth);
    }
  }
}


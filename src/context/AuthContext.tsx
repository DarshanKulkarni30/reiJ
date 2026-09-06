import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  isConfigured,
} from "../lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from "firebase/auth";
import { UserProfile } from "../types";
import { getUserProfile, saveUserProfile } from "../lib/storage";

interface AuthContextType {
  currentUser: User | { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isOnboarded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_KEY = "rei_active_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local preview mode
      const cached = localStorage.getItem(LOCAL_AUTH_KEY);
      if (cached) {
        try {
          const userObj = JSON.parse(cached);
          setCurrentUser(userObj);
          getUserProfile(userObj.uid).then((prof) => setUserProfile(prof));
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (isConfigured && auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        setCurrentUser(user);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        // In local/preview without Firebase keys, authenticate as the builder account
        const mockUser = {
          uid: "darshan_user_reij",
          displayName: "Darshan",
          email: "darshan.kulkarni30@gmail.com",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        const profile = await getUserProfile(mockUser.uid);
        setUserProfile(profile);
      }
    } catch (error: any) {
      console.error("[Auth Sign-In Error]:", error?.message || error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isConfigured && auth) {
      await fbSignOut(auth);
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const saveProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const existing = (await getUserProfile(currentUser.uid)) || {
      uid: currentUser.uid,
      name: currentUser.displayName || "Friend",
      email: currentUser.email || "",
      lifeContext: [],
      whatMattersNow: [],
      desiredTraits: [],
      personBecoming: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const merged: UserProfile = {
      ...existing,
      ...updates,
      uid: currentUser.uid,
      updatedAt: new Date().toISOString(),
    };

    await saveUserProfile(merged);
    setUserProfile(merged);
  };

  const isOnboarded = Boolean(
    userProfile &&
    userProfile.name &&
    userProfile.desiredTraits &&
    userProfile.desiredTraits.length === 3 &&
    userProfile.personBecoming
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        saveProfile,
        isOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

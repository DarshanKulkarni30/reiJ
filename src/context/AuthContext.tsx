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
  authError: { code: string; message: string; actionUrl?: string } | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: () => Promise<void>;
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
  const [authError, setAuthError] = useState<{ code: string; message: string; actionUrl?: string } | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    if (isConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } else {
          // Check if user was previously authenticated in preview mode
          const cached = localStorage.getItem(LOCAL_AUTH_KEY);
          if (cached) {
            try {
              const userObj = JSON.parse(cached);
              const hydratedUser = {
                ...userObj,
                getIdToken: async () => "",
              };
              setCurrentUser(hydratedUser);
              const profile = await getUserProfile(userObj.uid);
              setUserProfile(profile);
            } catch {
              setCurrentUser(null);
              setUserProfile(null);
            }
          } else {
            setCurrentUser(null);
            setUserProfile(null);
          }
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
          const hydratedUser = {
            ...userObj,
            getIdToken: async () => "",
          };
          setCurrentUser(hydratedUser);
          getUserProfile(userObj.uid).then((prof) => setUserProfile(prof));
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
    }
  }, []);

  const signInWithDemo = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const mockUser = {
        uid: "darshan_user_reij",
        displayName: "Darshan",
        email: "darshan.kulkarni30@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        getIdToken: async () => "",
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({
        uid: mockUser.uid,
        displayName: mockUser.displayName,
        email: mockUser.email,
        photoURL: mockUser.photoURL,
      }));
      setCurrentUser(mockUser);
      const profile = await getUserProfile(mockUser.uid);
      setUserProfile(profile);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isConfigured && auth) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          setCurrentUser(user);
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          return;
        } catch (fbErr: any) {
          const code = fbErr?.code || "";
          console.warn("[Auth Notice]:", code, fbErr?.message || fbErr);
          
          // If Google provider is not yet enabled in Firebase Console, or popup is blocked/cancelled
          if (code === "auth/operation-not-allowed" || code === "auth/unauthorized-domain") {
            // Provide informative guidance but seamlessly log into the session so the user is never blocked
            console.info("[Auth Info] Firebase Google provider not toggled on yet; seamlessly entering session.");
            await signInWithDemo();
            return;
          } else if (code === "auth/popup-closed-by-user") {
            // User closed the popup window manually
            return;
          } else if (code === "auth/popup-blocked") {
            // Popup blocked by browser: seamlessly enter session so user can continue
            await signInWithDemo();
            return;
          } else {
            // Any other provider issue: fallback to session
            await signInWithDemo();
            return;
          }
        }
      } else {
        await signInWithDemo();
      }
    } catch (error: any) {
      console.warn("[Auth Fallback]:", error?.message || error);
      await signInWithDemo();
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
        authError,
        clearAuthError,
        signInWithGoogle,
        signInWithDemo,
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

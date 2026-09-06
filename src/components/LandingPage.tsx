import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ReiLogo, ReiLogoMark } from "./ReiLogo";
import { ShieldCheck, ArrowRight, Palette, AlertTriangle, ExternalLink, X, Play } from "lucide-react";

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, signInWithDemo, loading, authError, clearAuthError } = useAuth();
  const { activeTheme, setManualTheme, themeConfig } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas,#F6FAF6)] text-[var(--color-text-primary,#152419)] flex flex-col justify-between selection:bg-[var(--color-accent-subtle,#E3F2E8)] transition-colors duration-200">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-[var(--color-border-subtle,#E6EFE8)]">
        <ReiLogo size="md" showWordmark={true} />

        {/* Theme Palette Bar & Sign In */}
        <div className="flex items-center gap-3">
          {/* Quick theme preview dots */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-2xs">
            <Palette className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)] mr-1" />
            {themeConfig.slice(0, 5).map((t) => (
              <button
                key={t.id}
                onClick={() => setManualTheme(t.id)}
                title={`Preview ${t.label} palette`}
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  activeTheme === t.id ? "scale-125 ring-2 ring-[var(--color-accent,#1C6E41)]/40" : "border-black/15 hover:scale-110"
                }`}
                style={{ backgroundColor: t.previewColors[1] }}
              />
            ))}
          </div>

          <button
            id="header-sign-in-btn"
            onClick={() => signInWithGoogle()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] hover:bg-[var(--color-bg-subtle,#ECF4EC)] text-[var(--color-text-primary,#152419)] transition-all shadow-xs active:scale-[0.98]"
          >
            <span>Sign in with Google</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted,#677D6D)]" />
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-center">
        {/* Dynamic Radiant Portal Aura */}
        <div className="relative mb-8 w-fit">
          <div className="absolute -inset-2 rounded-full bg-radial from-[var(--color-accent,#1C6E41)]/20 via-transparent to-transparent blur-xl pointer-events-none" />
          <div className="relative flex items-center gap-3.5 p-2 pr-5 rounded-full bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xs">
            <ReiLogoMark sizePx={38} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[var(--color-text-primary,#152419)]">
                Personal Evolution System
              </span>
              <span className="text-[11px] text-[var(--color-text-muted,#677D6D)]">
                The journal is the interface. The product is a living model.
              </span>
            </div>
          </div>
        </div>

        {/* Hero Title & Tagline */}
        <div className="space-y-5 mb-8">
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-light text-[var(--color-text-primary,#152419)] tracking-tight leading-[1.04]">
            See yourself. <br />
            <span className="italic font-normal text-[var(--color-accent,#1C6E41)]">
              Shape yourself.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-secondary,#405746)] font-sans max-w-2xl font-light leading-relaxed">
            A personal growth journal that learns from your experiences and helps you evolve with intention.
            Rei captures your honest words, discovers genuine patterns, and tests observable practices.
          </p>
        </div>

        {/* Auth Error Notification Banner */}
        {authError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary,#152419)]">
                    {authError.code === "auth/operation-not-allowed"
                      ? "Google Sign-In Provider Needs to be Enabled"
                      : "Sign-In Action Needed"}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed">
                    {authError.message}
                  </p>
                  {authError.code === "auth/operation-not-allowed" && (
                    <p className="text-xs text-[var(--color-text-muted,#677D6D)]">
                      <strong>Fix in 10 seconds:</strong> In Firebase Console &gt; Authentication &gt; Sign-in method, click <strong>Google</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {authError.actionUrl && (
                      <a
                        href={authError.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)] text-xs font-medium hover:bg-[var(--color-accent-hover,#145532)] transition-colors"
                      >
                        <span>Open Firebase Console</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => signInWithDemo()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] text-[var(--color-text-primary,#152419)] text-xs font-medium hover:bg-[var(--color-bg-subtle,#ECF4EC)] transition-colors shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)]" />
                      <span>Continue in Preview Mode (as Darshan)</span>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={clearAuthError}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 pb-14">
          <button
            id="hero-google-auth-btn"
            onClick={() => signInWithGoogle()}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[var(--color-accent,#1C6E41)] hover:bg-[var(--color-accent-hover,#145532)] text-[var(--color-accent-contrast,#FFFFFF)] font-medium text-base shadow-sm transition-all duration-150 active:scale-[0.985] hover:shadow-md"
          >
            <svg className="w-5 h-5 bg-white p-0.5 rounded-full shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? "Connecting..." : "Begin with Google"}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted,#677D6D)]">
            <ShieldCheck className="w-4 h-4 text-[var(--color-accent,#1C6E41)]" />
            <span>Private & isolated to your account • Never shared</span>
          </div>
        </div>

        {/* The Core Loop Architecture Cards */}
        <div className="border-t border-[var(--color-border,#D4E3D7)] pt-12 pb-6">
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-secondary,#405746)] font-semibold mb-6">
            The Living Model Architecture
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-left">
            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-subtle,#ECF4EC)] flex items-center justify-center text-[var(--color-accent,#1C6E41)] mb-3 text-xs font-serif font-bold">
                01
              </div>
              <h4 className="font-serif text-base text-[var(--color-text-primary,#152419)] font-medium mb-1">
                Capture
              </h4>
              <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed">
                Daily mood, intentions, and candid reflections.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-subtle,#ECF4EC)] flex items-center justify-center text-[var(--color-accent,#1C6E41)] mb-3 text-xs font-serif font-bold">
                02
              </div>
              <h4 className="font-serif text-base text-[var(--color-text-primary,#152419)] font-medium mb-1">
                Understand
              </h4>
              <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed">
                Detects underlying emotions, themes, and behavior.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-subtle,#ECF4EC)] flex items-center justify-center text-[var(--color-accent,#1C6E41)] mb-3 text-xs font-serif font-bold">
                03
              </div>
              <h4 className="font-serif text-base text-[var(--color-text-primary,#152419)] font-medium mb-1">
                Reflect
              </h4>
              <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed">
                One next best question. Reflection before advice.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-subtle,#ECF4EC)] flex items-center justify-center text-[var(--color-accent,#1C6E41)] mb-3 text-xs font-serif font-bold">
                04
              </div>
              <h4 className="font-serif text-base text-[var(--color-text-primary,#152419)] font-medium mb-1">
                Practice
              </h4>
              <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed">
                Convert target traits into observable micro-actions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-2xs col-span-2 md:col-span-1">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-subtle,#ECF4EC)] flex items-center justify-center text-[var(--color-accent,#1C6E41)] mb-3 text-xs font-serif font-bold">
                05
              </div>
              <h4 className="font-serif text-base text-[var(--color-text-primary,#152419)] font-medium mb-1">
                Evolve
              </h4>
              <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed">
                Potential | Observed | Desired living personal model.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Understated Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-[var(--color-border-subtle,#E6EFE8)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted,#677D6D)]">
        <p>Rei is a private reflection tool, not medical, mental-health, or financial advice.</p>
        <p>© {new Date().getFullYear()} Rei • Built for the Cloud Run AI Challenge</p>
      </footer>
    </div>
  );
};

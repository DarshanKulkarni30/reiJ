import React from "react";
import { useAuth } from "../context/AuthContext";
import { Compass, BookOpen, Sparkles, Feather, ShieldCheck, ArrowRight } from "lucide-react";

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#1E201E] flex flex-col justify-between selection:bg-[#E3E8E3]">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1E201E] flex items-center justify-center text-[#FBFBF9] font-serif text-lg font-medium tracking-tight">
            R
          </div>
          <span className="font-serif text-2xl font-normal tracking-tight text-[#1E201E]">Rei</span>
        </div>

        <button
          id="header-sign-in-btn"
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-[#DCDFD9] bg-white hover:bg-[#F2F4F0] transition-colors shadow-xs active:scale-[0.98]"
        >
          <span>Sign in with Google</span>
          <ArrowRight className="w-4 h-4 text-[#606460]" />
        </button>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-center">
        {/* Builder Greeting */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFEFEA] border border-[#E0E2DC] text-xs text-[#4A4E4A] font-medium w-fit mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3C4A3E]"></span>
          <span>Welcome, Darshan. Personal Evolution System</span>
        </div>

        {/* Hero Title & Tagline */}
        <div className="space-y-4 mb-8">
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light text-[#1E201E] tracking-tight leading-[1.08]">
            See yourself. <br />
            <span className="italic font-normal text-[#2D3A2F]">Shape yourself.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#525752] font-sans max-w-2xl font-light leading-relaxed">
            A personal growth journal that learns from your experiences and helps you evolve with intention.
            The journal is the interface. The product is a living personal model.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 pb-14">
          <button
            id="hero-google-auth-btn"
            onClick={() => signInWithGoogle()}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full bg-[#1E201E] hover:bg-[#2D3A2F] text-[#FBFBF9] font-medium text-base shadow-sm transition-all duration-150 active:scale-[0.99]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-2 text-xs text-[#6A706A]">
            <ShieldCheck className="w-4 h-4 text-[#3C4A3E]" />
            <span>Private & isolated to your account • Never shared</span>
          </div>
        </div>

        {/* The Core Loop Blueprint */}
        <div className="border-t border-[#E5E7E1] pt-12 pb-6">
          <p className="text-xs uppercase tracking-widest text-[#7A807A] font-semibold mb-6">
            The Living Model Architecture
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
            <div className="p-4 rounded-xl bg-white/70 border border-[#E7E9E3]">
              <div className="w-7 h-7 rounded-lg bg-[#EFEFEA] flex items-center justify-center text-[#2D3A2F] mb-3 text-xs font-serif font-bold">
                01
              </div>
              <h4 className="font-serif text-base text-[#1E201E] font-medium mb-1">Capture</h4>
              <p className="text-xs text-[#606460] leading-relaxed">
                Daily mood, intentions, and honest free writes.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-[#E7E9E3]">
              <div className="w-7 h-7 rounded-lg bg-[#EFEFEA] flex items-center justify-center text-[#2D3A2F] mb-3 text-xs font-serif font-bold">
                02
              </div>
              <h4 className="font-serif text-base text-[#1E201E] font-medium mb-1">Understand</h4>
              <p className="text-xs text-[#606460] leading-relaxed">
                Extracts subtle emotions, recurring themes, and behavior.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-[#E7E9E3]">
              <div className="w-7 h-7 rounded-lg bg-[#EFEFEA] flex items-center justify-center text-[#2D3A2F] mb-3 text-xs font-serif font-bold">
                03
              </div>
              <h4 className="font-serif text-base text-[#1E201E] font-medium mb-1">Reflect</h4>
              <p className="text-xs text-[#606460] leading-relaxed">
                One next best question. Reflection before advice.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-[#E7E9E3]">
              <div className="w-7 h-7 rounded-lg bg-[#EFEFEA] flex items-center justify-center text-[#2D3A2F] mb-3 text-xs font-serif font-bold">
                04
              </div>
              <h4 className="font-serif text-base text-[#1E201E] font-medium mb-1">Practice</h4>
              <p className="text-xs text-[#606460] leading-relaxed">
                Convert target traits into observable micro-behaviors.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-[#E7E9E3] col-span-2 md:col-span-1">
              <div className="w-7 h-7 rounded-lg bg-[#EFEFEA] flex items-center justify-center text-[#2D3A2F] mb-3 text-xs font-serif font-bold">
                05
              </div>
              <h4 className="font-serif text-base text-[#1E201E] font-medium mb-1">Evolve</h4>
              <p className="text-xs text-[#606460] leading-relaxed">
                Potential | Observed | Desired columns on Your Model.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Understated Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-[#EAECE6] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A807A]">
        <p>Rei is a private reflection tool, not medical, mental-health, or financial advice.</p>
        <p>© {new Date().getFullYear()} Rei • Built for the Cloud Run AI Challenge</p>
      </footer>
    </div>
  );
};

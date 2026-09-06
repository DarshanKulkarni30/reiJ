import React from "react";

interface ReiLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  wordmarkClassName?: string;
  onClick?: () => void;
}

export const ReiLogoMark: React.FC<{ className?: string; sizePx?: number }> = ({
  className = "w-8 h-8",
  sizePx = 32,
}) => {
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="Rei emblem"
    >
      <defs>
        {/* Vibrant Jewel Gradients for the Lenses */}
        <linearGradient id="reiGradA" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6B4A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>

        <linearGradient id="reiGradB" x1="40" y1="10" x2="8" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="45%" stopColor="#6366F1" />
          <stop offset="80%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FF6B4A" />
        </linearGradient>

        <radialGradient id="reiLocus" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#EC4899" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
        </radialGradient>

        <filter id="reiGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#6366F1" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Radiant ambient glow */}
      <circle cx="24" cy="24" r="15" fill="url(#reiLocus)" />

      {/* Lens 1: Outer Reflective Arc (See Yourself) */}
      <path
        d="M24 6C14.0589 6 6 14.0589 6 24C6 33.9411 14.0589 42 24 42C29.28 42 34.05 39.73 37.4 36.1C35.2 37.3 32.7 38 30 38C20.06 38 12 29.94 12 20C12 14.5 14.47 9.58 18.4 6.3C20.2 6.1 22.07 6 24 6Z"
        fill="url(#reiGradA)"
        filter="url(#reiGlow)"
      />

      {/* Lens 2: Inner Evolving Aperture (Shape Yourself) */}
      <path
        d="M24 10C31.732 10 38 16.268 38 24C38 31.732 31.732 38 24 38C20.6 38 17.47 36.78 15 34.75C17.25 35.55 19.68 36 22.2 36C29.38 36 35.2 30.18 35.2 23C35.2 16.25 29.97 10.72 23.3 10.05C23.53 10.02 23.76 10 24 10Z"
        fill="url(#reiGradB)"
      />

      {/* Central Locus - Focus & Alignment */}
      <circle cx="24" cy="24" r="4.5" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="2.5" fill="#1E201E" />
    </svg>
  );
};

export const ReiLogo: React.FC<ReiLogoProps> = ({
  size = "md",
  showWordmark = true,
  showTagline = false,
  className = "",
  wordmarkClassName = "",
  onClick,
}) => {
  const sizeMap = {
    xs: { mark: 22, text: "text-lg", gap: "gap-1.5" },
    sm: { mark: 28, text: "text-xl", gap: "gap-2" },
    md: { mark: 36, text: "text-2xl", gap: "gap-2.5" },
    lg: { mark: 44, text: "text-3xl", gap: "gap-3" },
    xl: { mark: 54, text: "text-4xl", gap: "gap-3.5" },
    hero: { mark: 64, text: "text-5xl sm:text-6xl", gap: "gap-4" },
  };

  const current = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${current.gap} select-none ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
    >
      <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
        <ReiLogoMark sizePx={current.mark} className="drop-shadow-xs" />
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={`font-serif font-normal tracking-tight leading-none text-[var(--color-text-primary,#1E201E)] ${current.text} ${wordmarkClassName}`}
          >
            Rei
          </span>
          {showTagline && (
            <span className="text-[11px] font-sans font-medium tracking-wide text-[var(--color-text-muted,#6B7280)] mt-0.5">
              See yourself. Shape yourself.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

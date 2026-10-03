import React from "react";

interface KhujoLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const KhujoLogo: React.FC<KhujoLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const dimensions = {
    sm: { icon: 28, textClass: "text-lg" },
    md: { icon: 36, textClass: "text-xl" },
    lg: { icon: 48, textClass: "text-2xl sm:text-3xl" },
    xl: { icon: 60, textClass: "text-3xl sm:text-4xl" },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 drop-shadow-xs"
      >
        <defs>
          <linearGradient id="khujoBrandGrad" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="52%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="khujoInnerGlow" x1="16" y1="16" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          fill="url(#khujoBrandGrad)"
        />
        <circle
          cx="28.5"
          cy="28.5"
          r="12.5"
          stroke="#FFFFFF"
          strokeWidth="4.2"
        />
        <path
          d="M38 38L48.5 48.5"
          stroke="#FFFFFF"
          strokeWidth="4.8"
          strokeLinecap="round"
        />
        <path
          d="M28.5 20.5L30.6 26.4L36.5 28.5L30.6 30.6L28.5 36.5L26.4 30.6L20.5 28.5L26.4 26.4L28.5 20.5Z"
          fill="url(#khujoInnerGlow)"
        />
        <circle cx="28.5" cy="28.5" r="2.2" fill="#FFFFFF" />
      </svg>
      {showText && (
        <span
          className={`font-bold tracking-tight text-slate-900 ${dimensions.textClass} whitespace-nowrap`}
        >
          KHUJO{" "}
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            AI
          </span>
        </span>
      )}
    </div>
  );
};

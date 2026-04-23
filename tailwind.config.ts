import type { Config } from "tailwindcss";

/**
 * Theme direction: mid-2000s Frutiger Aero / Web 2.0 on a deep
 * emerald base. Panels are frosted translucent "aqua" with a top
 * specular highlight; buttons are glossy pills with a vertical light→
 * dark gradient; accents are aqua-teal and phosphor-green. Typography
 * is Lucida Grande / Segoe UI / Tahoma — the actual fonts the era
 * shipped on Mac OS X Tiger, Win XP, and Vista.
 *
 * The `ink-*` scale keeps its light→dark direction so existing
 * `text-ink-900` / `border-ink-200` / `bg-ink-50` usages repaint
 * automatically into the new palette.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Mid-2000s system-font stack. Lucida Grande was the
        // default Mac OS X UI font through 10.9; Segoe UI shipped
        // with Vista; Tahoma with Win 2000/XP. These were THE
        // interface fonts of 2003-2009.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Lucida Grande",
          "Segoe UI",
          "Tahoma",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        // Reserve monospace for code-like content (kbd, pre, api
        // samples). The body is no longer mono.
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        // Display / logotype — the soft rounded sans of early
        // Web 2.0 (iTunes 7 / Adium era).
        display: [
          "Lucida Grande",
          "Segoe UI",
          "Tahoma",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      colors: {
        // ink-*: frosted-glass / mist tonal scale. Low numbers =
        // near-white panel bg. Mid numbers = translucent chrome.
        // High numbers = deep forest text for contrast on glass.
        ink: {
          50: "#f7fbf9",
          100: "#eaf4ee",
          200: "#c7e0d1",
          300: "#9bc4ab",
          400: "#5f9476",
          500: "#3e7757",
          600: "#27593c",
          700: "#194227",
          800: "#0f2a19",
          900: "#061810",
        },

        // Deep emerald / forest chrome. Page bg ranges 800-900.
        forest: {
          50: "#e6f5ec",
          100: "#bfe4cd",
          200: "#8fcea8",
          300: "#5ab182",
          400: "#2f9660",
          500: "#10b981",
          600: "#0a8a5f",
          700: "#086a47",
          800: "#043d28",
          900: "#021f14",
        },

        // Aqua / teal — the signature Y2K "water" accent. Used in
        // glows, pills, bullet dots, and the Aqua-style buttons.
        aqua: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },

        // Phosphor retained for dot/LED accents but softened.
        phosphor: {
          DEFAULT: "#34d399",
          dim: "#10b981",
          glow: "#a7f3d0",
        },

        accent: {
          DEFAULT: "#10b981",
          soft: "#d1fae5",
        },
        error: {
          DEFAULT: "#dc2626",
          soft: "#fee2e2",
        },
        warn: {
          DEFAULT: "#d97706",
          soft: "#fef3c7",
        },
        ok: {
          DEFAULT: "#059669",
          soft: "#d1fae5",
        },
      },
      boxShadow: {
        // Frutiger Aero panel lift — soft blurred drop + edge ring.
        aero:
          "0 1px 0 0 rgba(255,255,255,0.35) inset, 0 20px 40px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
        "aero-sm":
          "0 1px 0 0 rgba(255,255,255,0.35) inset, 0 8px 20px -6px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
        // Aqua-button drop — the "wet" look under iTunes pill buttons.
        "aero-button":
          "0 1px 0 0 rgba(255,255,255,0.55) inset, 0 6px 16px -4px rgba(6, 95, 70, 0.55), 0 0 0 1px rgba(0,0,0,0.12)",
        // Inner highlight only — for pressed / active state.
        "aero-pressed":
          "0 2px 4px 0 rgba(0,0,0,0.25) inset, 0 0 0 1px rgba(0,0,0,0.18)",
      },
      backgroundImage: {
        // Canonical Y2K glossy button — top light → midline darker →
        // bottom lighter again, evoking a reflective lozenge.
        "gloss-green":
          "linear-gradient(180deg, #34d399 0%, #10b981 48%, #059669 52%, #047857 100%)",
        "gloss-aqua":
          "linear-gradient(180deg, #67e8f9 0%, #22d3ee 48%, #0891b2 52%, #0e7490 100%)",
        "gloss-white":
          "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.86) 48%, rgba(240,245,243,0.9) 52%, rgba(230,240,235,0.92) 100%)",
        // Page-level radial glow overlay for the body.
        "aero-sky":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.35), transparent 70%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(6,182,212,0.25), transparent 65%), linear-gradient(180deg, #043d28 0%, #021f14 100%)",
      },
      borderRadius: {
        // Y2K corners were generous — default up a notch.
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};

export default config;

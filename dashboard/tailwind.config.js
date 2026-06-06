/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind will scan these files for class names
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Dark mode driven by a class on <html> — matches ThemeContext behaviour
  darkMode: "class",

  theme: {
    extend: {
      // ─────────────────────────────────────────────
      // Map to the CSS custom properties already defined
      // in src/styles/_colors.scss.  This means Tailwind
      // utilities like `bg-background`, `text-foreground`,
      // `border-border`, etc. will automatically follow
      // whatever theme class is active on <html>.
      // ─────────────────────────────────────────────
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic status colors — used across badges, charts, tables
        success: {
          DEFAULT: "#22c55e",
          foreground: "#052e16",
          subtle: "rgba(34,197,94,0.12)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#451a03",
          subtle: "rgba(245,158,11,0.12)",
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "#450a0a",
          subtle: "rgba(239,68,68,0.12)",
        },
        info: {
          DEFAULT: "#3b82f6",
          foreground: "#eff6ff",
          subtle: "rgba(59,130,246,0.12)",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: ["'Work Sans'", "'Lato'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "Menlo", "monospace"],
      },

      // Glass-morphism utility backgrounds wired to CSS vars set by SCSS themes
      backdropBlur: {
        xs: "2px",
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-scale": "fade-in-scale 0.15s ease-out",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },

      // Glass morphism background utility
      backgroundImage: {
        "glass": "var(--theme-glass-bg)",
        "gradient-logo": "var(--theme-logo-bg)",
      },
    },
  },

  plugins: [],
};

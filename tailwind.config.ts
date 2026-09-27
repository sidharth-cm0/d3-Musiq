import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-archivo)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
      },
      gridTemplateColumns: {
        "16": "repeat(16, minmax(0, 1fr))",
      },
      colors: {
        d3: {
          ink: "#0D0C0A",
          paper: "#EDE9E1",
          amber: {
            DEFAULT: "#C9A46B",
            muted: "#9E7B45",
            glow: "rgba(201, 164, 107, 0.14)",
          },
          rust: {
            DEFAULT: "#8C4A3D",
            hover: "#A35848",
          },
          neutral: {
            950: "#0D0C0A",
            900: "#161512", // Surface 1
            850: "#1B1916", // Card background
            800: "#211F1C", // Surface 2
            700: "#2B2824", // Borders
            600: "#4A453E", // Active borders / Dividers
            500: "#7A736A", // Secondary text
            400: "#A8A196", // Muted text
            300: "#D4CFC4", // Body text
            200: "#EDE9E1", // High-contrast text
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

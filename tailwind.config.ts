import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: "#8B5CF6",
        background: {
          light: "#F9FAFB",
          dark: "#111827",
        },
        card: {
          light: "#FFFFFF",
          dark: "#1F2937",
        },
        text: {
          light: "#1F2937",
          dark: "#F3F4F6",
        },
        subtext: {
          light: "#6B7280",
          dark: "#9CA3AF",
        },
        accent: {
          light: "#F3E8FF",
          dark: "rgba(139, 92, 246, 0.2)",
        },
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        'primary': '0 10px 40px -10px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;

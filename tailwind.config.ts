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
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: "#8B5CF6",
        accent: {
          light: "#FEF3C7",
          DEFAULT: "#FBBF24",
          bright: "#FDE047",
          dark: "#F59E0B",
        },
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        brutalist: {
          border: "#000000",
          "border-dark": "#FFFFFF",
        },
        background: {
          light: "#F5F5F5",
          dark: "#1A1A1A",
        },
        card: {
          light: "#FFFFFF",
          dark: "#262626",
        },
        text: {
          light: "#000000",
          dark: "#FFFFFF",
        },
        subtext: {
          light: "#737373",
          dark: "#A3A3A3",
        },
        secondary: {
          light: "#F5F5DC",
          dark: "#8B8970",
        },
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '6': '6px',
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "2px",
        md: "4px",
        lg: "6px",
        full: "9999px",
      },
      boxShadow: {
        'brutal': '4px 4px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
        'brutal-accent': '4px 4px 0px #FBBF24',
        'brutal-dark': '4px 4px 0px #FFFFFF',
      },
    },
  },
  plugins: [],
};
export default config;

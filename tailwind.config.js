/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#050609",
          soft: "#0b1120",
          softer: "#020617",
        },
        imperial: {
          red: "#c8102e",
          dark: "#111827",
        },
        themeNightOps: {
          bg: '#050609',
          surface: '#0b1120',
          softer: '#020617',
        },
        themeHangar: {
          bg: '#0b1120',
          surface: '#111827',
          softer: '#020617',
        },
        themeBriefing: {
          bg: '#111827',
          surface: '#1f2937',
          softer: '#020617',
        },
      },
    },
  },
  plugins: [],
};

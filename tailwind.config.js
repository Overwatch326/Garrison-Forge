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
      },
    },
  },
  plugins: [],
};

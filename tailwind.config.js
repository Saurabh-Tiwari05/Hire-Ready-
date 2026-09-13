




/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        accent: "#00F2FF",
        glass: "rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};
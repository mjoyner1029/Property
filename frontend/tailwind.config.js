/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#121417",
        sidebar: "#1F2327",
        sidebarHover: "#2A2E33",
        textPrimary: "#F3F4F6",
        textSecondary: "#9CA3AF",
        accentBlue: "#3B82F6",
        accentHover: "#2563EB",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

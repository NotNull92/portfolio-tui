/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fallout: {
          green: "#00ff41",
          dark: "#000d02",
        }
      }
    },
  },
  plugins: [],
}
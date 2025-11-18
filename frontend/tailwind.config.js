/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,md}",
    "./public/**/*.{html,ts,md}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1B4F72",
          secondary: "#F4CB42",
          accent: "#48C9B0",
        },
        neutral: {
          light: "#F7F9FA",
          medium: "#D5D8DC",
          dark: "#2C3E50",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter Tight", "Inter", "sans-serif"],
      }
    }
  },
  plugins: [],
}


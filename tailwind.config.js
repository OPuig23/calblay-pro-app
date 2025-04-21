/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  safelist: [
    // Mides de logo que utilizarem des de App.js
    'w-40', 'w-48', 'w-56', 'w-64',
    'w-8',  'w-10', 'w-12', 'w-16',
  ],
  theme: {
    extend: {
      fontFamily: {
        baloo: ["'Baloo Bhai'", "cursive"],
      },
      colors: {
        primary:   "#FF6EC7",
        secondary: "#47FFC0",
        accent1:   "#FFD347",
        accent2:   "#FF9247",
        bgCard:    "#E0F8EC",
      },
    },
  },
  plugins: [],
};

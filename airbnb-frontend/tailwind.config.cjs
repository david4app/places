/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        secondary: '#0369a1',
        accent: '#e0f2fe',
        background: '#f0f9ff',
      },
    },
  },
  plugins: [],
};

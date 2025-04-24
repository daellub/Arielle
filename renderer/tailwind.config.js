/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // custom: ['BMDOHYEON'],
        BMDohyeon: ['BMDohyeon', 'sans-serif'],
        hakgyo: ["HakgyoansimWoojuR", "sans-serif"],
        omyu_pretty: ['omyu_pretty', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


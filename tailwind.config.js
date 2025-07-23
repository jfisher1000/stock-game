/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'primary': '#0052FF',
        'success': '#28A745',
        'danger': '#DC3545',
        'info': '#007BFF',
      }
    },
  },
  plugins: [],
}

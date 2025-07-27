/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#007BFF',
        'primary-focus': '#0056b3',
        'secondary': '#6c757d',
        'background': '#F8F9FA',
        'surface': '#FFFFFF',
        'text-primary': '#212529',
        'text-secondary': '#6c757d',
        'border': '#DEE2E6',
        'success': '#28A745',
        'error': '#DC3545',
        'warning': '#FFC107',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'ui-sm': '0.2rem',
        'ui': '0.4rem',
        'ui-lg': '0.8rem',
      },
      boxShadow: {
        'ui': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};

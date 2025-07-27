/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // 1. COLOR PALETTE
      // Semantic color names adapted for the existing dark theme.
      // This centralizes the design system for easy app-wide updates.
      colors: {
        // Core Interactive Colors
        'primary': '#0052FF',      // Main interactive color for buttons, links. Was already defined.
        'primary-focus': '#0041c2', // A slightly darker shade for hover/focus states.
        'secondary': '#a0aec0',    // Light gray for secondary text or less important elements.
        
        // Surface & Background Colors (based on index.css)
        'background': '#111827',   // Core background color from the body's linear gradient.
        'surface': 'rgba(255, 255, 255, 0.1)', // Background for glass-card elements.
        
        // Text Colors
        'text-primary': '#FFFFFF',    // Default text color for the dark theme.
        'text-secondary': '#CBD5E0', // Lighter gray for secondary or hint text.

        // Border Color (based on glass-card)
        'border': 'rgba(255, 255, 255, 0.18)', // Default border color for cards and inputs.

        // Status Colors
        'success': '#28A745',      // For success messages or icons. Was already defined.
        'danger': '#DC3545',       // For error messages or icons. Was already defined.
        'warning': '#FFC107',      // For warning messages or icons.
      },

      // 2. TYPOGRAPHY
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Sets 'Inter' as the default sans-serif font.
      },

      // 3. BORDER RADIUS
      // Standardized border-radius values for a consistent look on elements.
      borderRadius: {
        'ui-sm': '0.2rem',  // Small radius for inputs, small buttons.
        'ui': '0.5rem',     // Default radius for cards, modals. Matches current look.
        'ui-lg': '0.8rem',  // Large radius for containers.
      },

      // 4. BOX SHADOWS
      // Standardized shadow values for controlling elevation and depth.
      boxShadow: {
        'ui': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}

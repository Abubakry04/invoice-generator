/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF7916',
          600: '#FF7916',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
          950: '#431407',
          DEFAULT: '#FF7916',
        },
        blue: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF7916',
          600: '#FF7916',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
          950: '#431407',
        },
        brand: {
          50: 'var(--brand-50, #fff7ed)',
          100: 'var(--brand-100, #ffedd5)',
          200: 'var(--brand-200, #fed7aa)',
          300: 'var(--brand-300, #fdba74)',
          400: 'var(--brand-400, #fb923c)',
          500: 'var(--brand-500, #FF7916)',
          600: 'var(--brand-600, #FF7916)',
          700: 'var(--brand-700, #ea580c)',
          800: 'var(--brand-800, #c2410c)',
          900: 'var(--brand-900, #9a3412)',
          DEFAULT: '#FF7916',
        }
      }
    },
  },
  plugins: [],
}

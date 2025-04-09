/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: 'rgb(var(--body-bg) / <alpha-value>)',
        foreground: 'rgb(var(--body-text) / <alpha-value>)',
        
        primary: {
          DEFAULT: 'rgb(var(--primary-bg) / <alpha-value>)',
          foreground: 'rgb(var(--primary-text) / <alpha-value>)',
        },
        
        secondary: {
          DEFAULT: 'rgb(var(--secondary-bg) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-text) / <alpha-value>)',
        },
        
        accent: {
          DEFAULT: 'rgb(var(--accent-bg) / <alpha-value>)',
          foreground: 'rgb(var(--accent-text) / <alpha-value>)',
        },
        
        muted: {
          DEFAULT: 'rgb(var(--secondary-bg) / <alpha-value>)',
          foreground: 'rgb(var(--muted-text) / <alpha-value>)',
        },
        
        card: {
          DEFAULT: 'rgb(var(--card-bg) / <alpha-value>)',
          foreground: 'rgb(var(--body-text) / <alpha-value>)',
        },
        
        border: 'rgb(var(--card-border) / <alpha-value>)',
        input: 'rgb(var(--input-bg) / <alpha-value>)',
        ring: 'rgb(var(--primary-bg) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} 
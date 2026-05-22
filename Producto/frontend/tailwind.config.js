/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A3A5C',
        secondary: '#C8A84B',
        accent: '#8B1A1A',
        background: '#F5F0E8',
        darkbg: '#0F1E2E',
        muted: '#6B7280',
        success: '#2D6A4F',
        'fantasy-gold': 'var(--fantasy-gold)',
        'fantasy-accent': 'var(--fantasy-accent)',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
        display: ['Cinzel', 'serif'],
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

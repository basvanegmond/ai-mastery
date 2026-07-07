import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        trypan: { DEFAULT: '#1C05B3', light: '#EEEEFF' },
        canvas: { DEFAULT: '#FAFAFA', sub: '#F3F3F9' },
        ink: { DEFAULT: '#17172A', sub: '#6B6B8A' },
        edge: '#E4E4EF',
      },
    },
  },
  plugins: [],
} satisfies Config

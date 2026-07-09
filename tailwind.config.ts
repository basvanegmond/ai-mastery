import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        trypan: { DEFAULT: '#1C05B3', light: '#F0EEFF' },
        sidebar: '#1E1926',
        ambient: '#0D0B2B',
        canvas: { DEFAULT: '#FFFFFF', sub: '#F9F8FC' },
        ink: { DEFAULT: '#17172A', sub: '#6B6B8A' },
        edge: '#E2E2EE',
      },
    },
  },
  plugins: [],
} satisfies Config

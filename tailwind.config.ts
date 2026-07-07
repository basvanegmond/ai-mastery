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
        trypan: { DEFAULT: '#2563EB', light: '#EFF6FF' },
        canvas: { DEFAULT: '#FFFFFF', sub: '#F0F0F8' },
        ink: { DEFAULT: '#17172A', sub: '#6B6B8A' },
        edge: '#E2E2EE',
      },
    },
  },
  plugins: [],
} satisfies Config

import type { Config } from 'tailwindcss'

/** Design tokens ported exactly from uploaded index.html tailwind.config */
const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Inter', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
        inter: ['Inter', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        navy: '#1E3A5F',
        accent: {
          DEFAULT: '#2563EB',
          h: '#1D4ED8',
        },
        sky: '#F0F9FF',
        'card-bg': '#FFFFFF',
        border: '#E2E8F0',
        subtext: '#64748B',
        mint: '#D1FAE5',
        coral: '#FEE2E2',
        sun: '#FEF3C7',
        lav: '#EDE9FE',
        softorange: '#FFEDD5',
        pink: '#FCE7F3',
        slate: '#F1F5F9',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6B3F8D',
          'purple-light': '#8B5FB3',
          'purple-dark': '#4A2B63',
          pink: '#D65C8C',
          'pink-light': '#E88BAF',
          cream: '#FFFBF5',
          'cream-dark': '#FFF5E8',
          dark: '#1A1A2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

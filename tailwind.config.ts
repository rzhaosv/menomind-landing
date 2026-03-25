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
        // Sophisticated Wellness design system
        sw: {
          primary: '#37203b',
          'primary-container': '#4e3652',
          secondary: '#546253',
          'secondary-container': '#d7e7d3',
          surface: '#fcf9f8',
          'surface-low': '#f6f3f2',
          'surface-high': '#eae7e7',
          'surface-highest': '#e4e2e1',
          'on-surface': '#1b1c1c',
          'on-surface-variant': '#4c454b',
          outline: '#7d747c',
          'outline-variant': '#cec3cc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        headline: ['Noto Serif', 'Georgia', 'serif'],
        body: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

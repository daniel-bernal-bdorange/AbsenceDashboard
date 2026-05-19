import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orangeBusiness: {
          DEFAULT: '#FF7900',
          dark: '#CC5200',
          light: '#FF8533',
          pale: '#FFF0E6',
        },
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#333333',
          muted: '#666666',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f5f5f5',
        },
        success: '#2E7D32',
        warning: '#F57C00',
        error: '#C62828',
        info: '#0277BD',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
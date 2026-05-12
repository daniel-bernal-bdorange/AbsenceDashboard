import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orangeBusiness: {
          DEFAULT: '#ff6600',
          dark: '#cc5200',
          light: '#ff8533',
          pale: '#fff0e6',
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
        success: '#2e7d32',
        warning: '#f57c00',
        error: '#c62828',
        info: '#0277bd',
      },
      boxShadow: {
        soft: '0 12px 40px rgba(26, 26, 26, 0.08)',
        insetGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.55)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'orange-radial':
          'radial-gradient(circle at top left, rgba(255, 102, 0, 0.26), transparent 30%), radial-gradient(circle at top right, rgba(255, 133, 51, 0.18), transparent 26%), linear-gradient(180deg, #fffaf6 0%, #ffffff 44%, #fff6ef 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;

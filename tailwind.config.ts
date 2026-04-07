import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a2744',
          dark: '#0f1a2e',
          light: '#243556',
        },
        gold: {
          DEFAULT: '#c5a55a',
          dim: '#a08840',
        },
        cream: '#f7f6f3',
        'sidebar-bg': '#fcfbf9',
        border: '#e5e2db',
        'text-main': '#1a1a1a',
        'text-muted': '#6b7280',
      },
      fontFamily: {
        serif: ['"Libre Baskerville"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      width: {
        'sidebar-left': '260px',
        'sidebar-right': '240px',
      },
      maxWidth: {
        'reading-pane': '780px',
      },
    },
  },
  plugins: [],
};

export default config;

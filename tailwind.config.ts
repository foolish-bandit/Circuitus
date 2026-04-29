import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ink: near-black with a faint blue undertone — proper printer's ink
        ink: {
          DEFAULT: '#0E1116',
          soft: '#1F2530',
          muted: '#5A6373',
        },
        // Navy is the formal-document color — deeper and bluer than before
        navy: {
          DEFAULT: '#0A1F3D',
          dark: '#06152C',
          light: '#162E54',
        },
        // Brass replaces the old yellowy gold — looks like aged brass plate
        brass: {
          DEFAULT: '#9C7A1F',
          bright: '#B8932B',
          dim: '#7A5F18',
        },
        // Claret: the bordeaux of stamped-document red, used sparingly
        claret: {
          DEFAULT: '#7A1E2E',
          dark: '#5A1623',
        },
        // Paper / surfaces — warm ivory baseline with two graduated levels
        paper: {
          DEFAULT: '#F5F1E8',
          warm: '#EFEAD9',
          cool: '#FAF6EC',
        },
        // Hairline rules
        rule: {
          DEFAULT: '#D9D2C0',
          strong: '#B5AB95',
          faint: '#E9E3D2',
        },
        // Legacy aliases for incremental migration — point old tokens to new
        gold: {
          DEFAULT: '#9C7A1F',
          dim: '#7A5F18',
        },
        cream: '#F5F1E8',
        'sidebar-bg': '#FAF6EC',
        border: '#D9D2C0',
        'text-main': '#0E1116',
        'text-muted': '#5A6373',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', '"Source Serif Pro"', 'Georgia', 'serif'],
        display: ['"Source Serif 4"', '"Source Serif Pro"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontFeatureSettings: {
        // Old-style figures, ligatures — refined typography defaults
        editorial: '"onum", "liga", "kern"',
      },
      width: {
        'sidebar-left': '264px',
        'sidebar-right': '252px',
      },
      maxWidth: {
        'reading-pane': '720px',
        'reading-wide': '820px',
      },
      letterSpacing: {
        masthead: '0.32em',
        marque: '0.18em',
      },
      boxShadow: {
        // Subtle shadow used on cards — like a single sheet on a desk
        sheet: '0 1px 0 rgba(14, 17, 22, 0.04), 0 8px 24px -16px rgba(14, 17, 22, 0.18)',
        masthead: '0 1px 0 rgba(14, 17, 22, 0.06)',
      },
      backgroundImage: {
        // Lightweight grain — uses base64 SVG so no extra HTTP request
        'paper-grain':
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.025 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      },
    },
  },
  plugins: [],
};

export default config;

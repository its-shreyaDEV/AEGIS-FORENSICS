/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        teal: {
          DEFAULT: '#00ffb4',
          dim: 'rgba(0,255,180,0.12)',
          glow: 'rgba(0,255,180,0.25)',
        },
        ink: {
          950: '#04080f',
          900: '#080d18',
          800: '#0c1220',
          700: '#111827',
        },
      },
      animation: {
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'scanline':     'scanDown 3s linear infinite',
        'borderPulse':  'borderGlow 2s ease-in-out infinite',
        'fadeUp':       'fadeUp 0.5s ease-out forwards',
        'glitch':       'glitchClip 0.2s ease both',
      },
      keyframes: {
        scanDown: {
          '0%':   { top: '0%',   opacity: '0.7' },
          '100%': { top: '100%', opacity: '0' },
        },
        borderGlow: {
          '0%,100%': { 'box-shadow': '0 0 0px rgba(0,255,180,0)' },
          '50%':     { 'box-shadow': '0 0 18px rgba(0,255,180,0.35), inset 0 0 18px rgba(0,255,180,0.08)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glitchClip: {
          '0%,100%': { 'clip-path': 'inset(0 0 100% 0)' },
          '50%':     { 'clip-path': 'inset(0 0 0% 0)' },
        },
      },
      backgroundImage: {
        'grid-ink': `linear-gradient(rgba(0,255,180,0.03) 1px, transparent 1px),
                     linear-gradient(90deg, rgba(0,255,180,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'retro-green': '#f0f0f0',
        'retro-dark': '#0a0a0a',
        'retro-darker': '#000000',
        'retro-gray': '#1a1a1a',
        'retro-light-gray': '#2a2a2a',
        'retro-border': '#f0f0f0',
        'retro-text': '#f0f0f0',
        'retro-text-dim': '#cccccc',
        'retro-bg': '#0a0a0a',
        'retro-card': '#1a1a1a',
        'retro-hover': '#e0e0e0',
        'retro-disabled': '#404040',
      },
      fontFamily: {
        'retro': ['Courier New', 'monospace'],
        'terminal': ['Courier New', 'monospace'],
      },
      animation: {
        'scanline': 'scanline 2s linear infinite',
        'flicker': 'flicker 0.15s infinite linear',
        'typewriter': 'typewriter 4s steps(40) 1s 1 normal both',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      boxShadow: {
        'retro': '0 0 5px #f0f0f0',
        'retro-inner': 'inset 0 0 5px #f0f0f0',
      },
    },
  },
  plugins: [],
}
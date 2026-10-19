/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Galmuri11"', '"DungGeunMo"', '"Press Start 2P"', 'monospace'],
        pixelTitle: ['"DungGeunMo"', '"Galmuri11"', '"Press Start 2P"', 'monospace'],
      },
      colors: {
        rpg: {
          bg: '#161124',
          panel: '#221b36',
          panelLight: '#2e2448',
          parchment: '#fff8e7',
          parchmentDark: '#f2e2be',
          gold: '#ffd541',
          goldDark: '#d4941c',
          rose: '#ff5277',
          mint: '#38d9a9',
          sky: '#4dabf7',
          ink: '#2b1e16',
        }
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(255, 213, 65, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 10px rgba(255, 82, 119, 0.9))' },
        }
      },
      animation: {
        floatSlow: 'floatSlow 2.4s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Gowun Batang"', '"Noto Serif KR"', 'serif'],
        engSerif: ['"Cormorant Garamond"', '"Gowun Batang"', 'serif'],
        sans: ['"Pretendard"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        pixel: ['"Galmuri11"', 'monospace'],
      },
      colors: {
        bridal: {
          bg: '#f3ede2',
          paper: '#fffdf9',
          linen: '#faf5ec',
          blush: '#f9ebea',
          rose: '#d97b84',
          roseDark: '#b85d67',
          gold: '#c59b6d',
          goldLight: '#e6d5b8',
          sage: '#6b9071',
          sageLight: '#eaf2ec',
          ink: '#3b2f2f',
          muted: '#7d6e65',
        }
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        floatSlow: 'floatSlow 2.8s ease-in-out infinite',
        fadeIn: 'fadeIn 0.35s ease-out forwards',
      }
    },
  },
  plugins: [],
}

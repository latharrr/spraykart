/** @type {import('tailwindcss').Config} */

// Neutrals run from bone to ink so every utility-styled page sits in the house palette.
const stone = {
  50:  '#F6F4EF',
  100: '#EFEDE7',
  200: '#E2DFD8',
  300: '#CFCCC4',
  400: '#8F8C85',
  500: '#6E6B64',
  600: '#55534D',
  700: '#3F3D39',
  800: '#2A2926',
  900: '#161513',
  950: '#0D0D0D',
};

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-text)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        gray: stone,
        neutral: stone,
        bone: '#F6F4EF',
        paper: '#EAE8E3',
        ink: '#0D0D0D',
        merlot: { DEFAULT: '#5B1F2A', 600: '#4A1922' },
        brand: {
          50:  '#F4EDEE',
          100: '#E8D9DC',
          500: '#5B1F2A',
          600: '#4A1922',
          700: '#3B141B',
          900: '#230B10',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        shimmer: 'shimmer 1.6s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};

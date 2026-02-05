/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'booksaw': {
          cream: '#E8E2D8',
          beige: '#D4CFC5',
          sand: '#C4BDB0',
          brown: '#8B7355',
          'dark-brown': '#5C4A3D',
          'accent': '#B8860B',
        },
      },
      fontFamily: {
        'serif': ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
  presets: [require('@nativewind/tailwindcss/preset')],
};


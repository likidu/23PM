const lineClamp = require('@tailwindcss/line-clamp');
const gradients = require('tailwindcss-gradients');
module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Open Sans',
        'Helvetica Neue',
        'sans-serif',
      ],
      fontSize: {
        sm: '1.2rem',
        base: '1.4rem',
      },
      colors: {
        primary: 'var(--text-color)',
        secondary: 'var(--secondary-text-color)',
        divider: 'var(--divider-color)',
        accent: 'var(--accent-color)',
        focus: 'var(--focus-color)',
        card: 'var(--card-color)',
        'card-border': 'var(--card-border-color)',
      },
      linearGradientColors: {
        'gray-cover': ['rgba(229, 231, 235) 0%', 'white 20%', 'white 100%'],
        'gray-strip': ['rgb(156, 163, 175)', 'rgb(156, 163, 175) 2px', 'white 2px', 'white'],
      },
      repeatingLinearGradientDirections: (theme) => theme('linearGradientDirections'), // defaults to this value
      repeatingLinearGradientColors: (theme) => theme('linearGradientColors'), // defaults to {}
      repeatingLinearGradientLengths: {
        '5px': '5px',
        sm: '2px',
      },
    },
  },
  plugins: [lineClamp, gradients],
};

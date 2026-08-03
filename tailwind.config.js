/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#050B1E', panel: '#0B1733', cyan: '#00C8FF', electric: '#1976FF', muted: '#8DA2C8'
      },
      fontFamily: {
        sans: ['Manrope_400Regular'],
        medium: ['Manrope_500Medium'],
        semibold: ['Manrope_600SemiBold'],
        bold: ['Manrope_700Bold'],
        display: ['SpaceGrotesk_700Bold']
      }
    }
  },
  plugins: []
};

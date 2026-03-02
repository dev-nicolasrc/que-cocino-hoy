/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './templates/**/*.html',
    './politica-de-privacidad/**/*.html',
    './sobre-nosotros/**/*.html',
    './contacto/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        naranja: '#FF6B35',
        crema:   '#F7C59F',
        fondo:   '#EFEFD0',
        azul:    '#004E89',
      },
      fontFamily: {
        titulo: ['Nunito', 'sans-serif'],
        cuerpo: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

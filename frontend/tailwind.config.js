/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          primary:  '#EA580C', // naranja — botones, CTAs
          title:    '#9A3412', // rojo oscuro — títulos
          accent:   '#FED7AA', // melocotón — fondos secundarios
          bg:       '#FFF7ED', // crema — fondo general
          dark:     '#1C1917', // casi negro — texto
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e9f2fa',
          100: '#d3e5f5',
          200: '#a7cceb',
          300: '#7bb3e1',
          400: '#4f9ad7',
          500: '#2381cd',
          600: '#004a8d', // Senac Institucional Principal
          700: '#003d74',
          800: '#003366', // Senac Dark Hover
          900: '#00254d',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // Não sobrescreve seletores básicos globalmente sem intenção
    }),
  ],
}

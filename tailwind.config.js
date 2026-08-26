/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6fc',
          100: '#d7eaf8',
          200: '#b4d7f2',
          300: '#81bde9',
          400: '#469edd',
          500: '#1e83cc',
          600: '#004a8d', // Senac Institucional Principal
          700: '#003d74',
          800: '#003366', // Senac Dark Hover
          900: '#00254d',
          950: '#001633',
        },
        senac: {
          orange: '#f39200', // Laranja Senac Destaque
          'orange-hover': '#e07a00',
          'orange-light': '#fff4e6',
          'orange-dark': '#b36200',
          blue: '#004a8d',
          'blue-dark': '#003366',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Segoe UI', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.04), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'soft-md': '0 8px 24px -3px rgba(0, 74, 141, 0.08), 0 3px 8px -2px rgba(0, 0, 0, 0.03)',
        'soft-xl': '0 20px 35px -5px rgba(0, 74, 141, 0.12), 0 8px 16px -6px rgba(0, 0, 0, 0.04)',
        'glow-brand': '0 0 25px -3px rgba(0, 74, 141, 0.25)',
        'glow-orange': '0 0 25px -3px rgba(243, 146, 0, 0.35)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}

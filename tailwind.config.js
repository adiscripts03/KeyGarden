/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          50: '#f2fbf4',
          100: '#e1f7e6',
          200: '#c5eed0',
          300: '#99e0ac',
          400: '#64cc80',
          500: '#3eb15e',
          600: '#2d9049',
          700: '#26723c',
          800: '#225b33',
          900: '#1d4b2c',
          950: '#0b2915',
        },
        dark: {
          900: '#0a0d0c',
          850: '#0e1312',
          800: '#131917',
          750: '#18211e',
          700: '#1e2926',
          600: '#2b3a36',
          500: '#3f534e',
        }
      },
    },
  },
  plugins: [],
};

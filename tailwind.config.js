/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        looker: {
          blue: '#1A73E8',
          darkBlue: '#174EA6',
          lightBlue: '#E8F0FE',
          purple: '#6E2594',
          teal: '#12B5CB',
          amber: '#F9AB00',
          coral: '#EA4335',
          green: '#34A853'
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */

const plugin =require('tailwindcss/plugin')



module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        Outfit: ['Outfit', 'sans'],
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide':{
          '-ms-overflow-style':'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    })
  ],
}


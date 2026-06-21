import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Zelo — marinho como cor base
        primary: {
          50:  '#EAF2F8',
          100: '#D5E4F0',
          200: '#AAC6DD',
          300: '#7FA8C9',
          400: '#3F6F95',
          500: '#21527F',
          600: '#163D60',
          700: '#1A3F63', // hover (marinho mais claro)
          800: '#0E2A47', // marinho principal
          900: '#081A2E',
        },
        // Turquesa e azul da logo (acentos)
        teal: {
          400: '#33D0D5',
          500: '#17C3C9',
          600: '#109CA1',
        },
        brand: {
          navy: '#0E2A47',
          teal: '#17C3C9',
          blue: '#5B8DEF',
        },
        risk: {
          baixo: '#16a34a',
          moderado: '#ca8a04',
          alto: '#ea580c',
          critico: '#dc2626',
        },
      },
    },
  },
  plugins: [],
}
export default config

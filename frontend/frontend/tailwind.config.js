/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                secureblue: {
                    500: '#1a56db', // typical branding blue from screenshots
                    600: '#1e40af',
                }
            }
        },
    },
    plugins: [],
}

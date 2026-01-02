/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js}", "./*.html", "./js/**/*.js"],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                brand: {
                    DEFAULT: '#3b82f6', // Bright Blue
                    dark: '#1d4ed8',
                    light: '#60a5fa',
                    glow: '#3b82f680', // Transparent for glow
                },
                dark: {
                    bg: '#0f172a', // Slate 900
                    surface: '#1e293b', // Slate 800
                    border: '#334155', // Slate 700
                }
            },
            boxShadow: {
                'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }
        },
    },
    plugins: [],
}

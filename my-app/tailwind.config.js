/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1E40AF', // Example blue, can be adjusted
                secondary: '#F59E0B', // Example amber
            }
        },
    },
    plugins: [],
}

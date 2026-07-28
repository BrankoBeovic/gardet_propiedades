/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    DEFAULT: '#C5A262',
                    light: '#D4B87A',
                    dark: '#A8894F',
                    50: '#F9F5ED',
                    100: '#F0E8D4',
                    200: '#E1D1A9',
                    300: '#D4B87A',
                    400: '#C5A262',
                    500: '#A8894F',
                    600: '#8B703F',
                    700: '#6E5830',
                    800: '#514121',
                    900: '#342A15',
                },
                obsidian: {
                    DEFAULT: '#141414',
                    light: '#1C1C1E',
                    dark: '#0A0A0A',
                    50: '#3A3A3A',
                    100: '#333333',
                    200: '#2C2C2C',
                    300: '#252525',
                    400: '#1E1E1E',
                    500: '#141414',
                    600: '#0F0F0F',
                    700: '#0A0A0A',
                },
                ivory: {
                    DEFAULT: '#F8F6F0',
                    dark: '#E8E6E0',
                    light: '#FDFCFA',
                },
                charcoal: {
                    DEFAULT: '#2A2A2D',
                    light: '#353538',
                    dark: '#1F1F22',
                },
                // Keep backward compatibility aliases
                primary: '#C5A262',
                secondary: '#2A2A2D',

                // Gardet custom namespace colors
                'gardet-obsidian': '#141414',
                'gardet-gold': '#C5A262',
                'gardet-goldLight': '#D4B87A',
                'gardet-border': 'rgba(197, 162, 98, 0.2)',
                'gardet-muted': '#94A3B8',
            },
            fontFamily: {
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
                cormorant: ['"Cormorant Garamond"', 'serif'],
            },
            letterSpacing: {
                'brand': '1.5px',
                'descriptor': '8.5px',
                'widest-plus': '0.2em',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
                'fade-in-up': 'fadeInUp 0.8s ease-out',
                'shimmer': 'shimmer 2s infinite linear',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}

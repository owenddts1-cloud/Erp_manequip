/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ["selector", '[modo-light-dark="dark"], [modo-light-dark="contrast"]'],
    theme: {
        extend: {
            colors: {
                "primary": "#0ea5e9",
                "primary-hover": "#38bdf8",
                "background-dark": "#020617",
                "surface-dark": "#0f172a",
                "surface-border": "#1e293b",
                "text-main": "#f8fafc",
                "text-muted": "#94a3b8",
                "success": "#10b981",
                "danger": "#ef4444",
                "warning": "#f59e0b",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
                "body": ["Noto Sans", "sans-serif"],
            },
            backgroundImage: {
                'cyber-grid': "radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.05) 0%, transparent 50%), linear-gradient(0deg, transparent 24%, rgba(30, 41, 59, .3) 25%, rgba(30, 41, 59, .3) 26%, transparent 27%, transparent 74%, rgba(30, 41, 59, .3) 75%, rgba(30, 41, 59, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(30, 41, 59, .3) 25%, rgba(30, 41, 59, .3) 26%, transparent 27%, transparent 74%, rgba(30, 41, 59, .3) 75%, rgba(30, 41, 59, .3) 76%, transparent 77%, transparent)",
            },
            backgroundSize: {
                'cyber-grid': '100% 100%, 60px 60px, 60px 60px',
            }
        },
    },
    plugins: [],
}

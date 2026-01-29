import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-outfit)', 'var(--font-noto-sans)', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
        },
        primary: "var(--primary)",
        accent: "var(--accent)",
        "accent-readable": "var(--accent-readable)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        border: "var(--border)",
        overlay: "var(--overlay)",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      zIndex: {
        'base': '0',
        'card': '10',
        'sticky': '100',
        'fab': '200',
        'dropdown': '300',
        'modal-overlay': '1000',
        'modal': '1001',
        'toast': '2000',
        'noise': '9999',
      },
      boxShadow: {
        'card': "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        'card-hover': "0 8px 24px rgba(0,0,0,0.1)",
        'sheet': "0 -4px 32px rgba(0,0,0,0.15)",
        'fab': "0 4px 14px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
}

export default config

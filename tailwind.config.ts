
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animatePlugin from "tailwindcss-animate";
import typographyPlugin from "@tailwindcss/typography";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        farmaze: {
          green: "#16A34A",
          orange: "#f97316",
          "in-progress": "#3b82f6",
          delivered: "#16A34A",
          canceled: "#ef4444",
          pink: "#F16870",
          lightPink: "#FFE4E6",
          gold: "#EAB308",
          lightGold: "#FEF3C7",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        inter: ["Inter", "sans-serif"],
        playfair: ["Playfair Display", "serif"],
        rubik: ["Rubik", "serif"]
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        'infinite-scroll': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(calc(-50%))' }
				},
				'float-up': {
					'0%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
					'100%': { transform: 'translateY(0)' }
				},
        "fade-in-up": {
          "0%": { 
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "slide-in-right": {
          "0%": { 
            opacity: "0",
            transform: "translateX(-20px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateX(0)"
          }
        },
        "slide-in-left": {
          "0%": { 
            opacity: "0",
            transform: "translateX(20px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateX(0)"
          }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "bounce-subtle": {
          "0%, 100%": {
            transform: "translateY(0)"
          },
          "50%": {
            transform: "translateY(-5px)"
          }
        },
        "pulse-subtle": {
          "0%, 100%": {
            opacity: "1"
          },
          "50%": {
            opacity: "0.8"
          }
        },
        "connection-pulse": {
          "0%": { opacity: "0.3" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.3" }
        },
        "dot-right": {
          "0%": { 
            transform: "translateX(0)",
            opacity: "0" 
          },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { 
            transform: "translateX(200px)",
            opacity: "0" 
          }
        },
        "dot-left": {
          "0%": { 
            transform: "translateX(0)",
            opacity: "0" 
          },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { 
            transform: "translateX(-200px)",
            opacity: "0" 
          }
        },
        "path-animation": {
          "0%": { 
            strokeDashoffset: "1000"
          },
          "100%": { 
            strokeDashoffset: "0"
          }
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0)"
          },
          "50%": {
            transform: "translateY(-8px)"
          }
        },
        "ping-slow": {
          "0%": {
            transform: "scale(1)",
            opacity: "1"
          },
          "75%, 100%": {
            transform: "scale(1.5)",
            opacity: "0"
          }
        },
        "item-added-pulse": {
          "0%": { backgroundColor: "rgba(22, 163, 74, 0.2)" },
          "50%": { backgroundColor: "rgba(22, 163, 74, 0.1)" },
          "100%": { backgroundColor: "transparent" }
        },
        "quantity-changed": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out",
				'infinite-scroll': 'infinite-scroll 30s linear infinite',
				'float-up': 'float-up 3s ease-in-out infinite',
        "slide-in-right": "slide-in-right 0.8s ease-out",
        "slide-in-left": "slide-in-left 0.8s ease-out",
        "fade-in": "fade-in 0.8s ease-out",
        "bounce-subtle": "bounce-subtle 3s ease-in-out infinite",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "connection-pulse": "connection-pulse 2s infinite",
        "dot-right": "dot-right 2s forwards",
        "dot-left": "dot-left 2s forwards",
        "path-animation": "path-animation 2s ease-in-out forwards",
        "float": "float 4s ease-in-out infinite",
        "ping-slow": "ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "item-added-pulse": "item-added-pulse 1s ease-out forwards",
        "quantity-changed": "quantity-changed 0.3s ease-in-out"
      },
    },
  },
  plugins: [animatePlugin, typographyPlugin],
} satisfies Config;

export default config;

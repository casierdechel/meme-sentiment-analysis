import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-primary": "#1000a9",
        "outline": "#908fa0",
        "on-tertiary-container": "#5b0017",
        "tertiary-fixed-dim": "#ffb2b7",
        "on-primary-container": "#0d0096",
        "on-surface": "#e5e1e4",
        "secondary-fixed": "#6ffbbe",
        "secondary-container": "#00a572",
        "on-error": "#690005",
        "surface-variant": "#353437",
        "surface-container": "#201f21",
        "on-secondary-fixed-variant": "#005236",
        "on-secondary-container": "#00311f",
        "primary-container": "#8083ff",
        "error-container": "#93000a",
        "surface-dim": "#131315",
        "surface-container-low": "#1b1b1d",
        "on-error-container": "#ffdad6",
        "on-secondary": "#003824",
        "tertiary": "#ffb2b7",
        "on-tertiary": "#67001b",
        "surface": "#131315",
        "on-surface-variant": "#c7c4d7",
        "outline-variant": "#464554",
        "surface-bright": "#39393b",
        "surface-container-highest": "#353437",
        "surface-container-high": "#2a2a2c",
        "secondary-fixed-dim": "#4edea3",
        "inverse-primary": "#494bd6",
        "background": "#131315",
        "primary-fixed": "#e1e0ff",
        "on-tertiary-fixed-variant": "#92002a",
        "primary-fixed-dim": "#c0c1ff",
        "on-secondary-fixed": "#002113",
        "tertiary-fixed": "#ffdadb",
        "on-tertiary-fixed": "#40000d",
        "error": "#ffb4ab",
        "tertiary-container": "#ff516a",
        "on-primary-fixed": "#07006c",
        "inverse-surface": "#e5e1e4",
        "on-background": "#e5e1e4",
        "inverse-on-surface": "#313032",
        "on-primary-fixed-variant": "#2f2ebe",
        "secondary": "#4edea3",
        "surface-tint": "#c0c1ff",
        "primary": "#c0c1ff",
        "surface-container-lowest": "#0e0e10"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        base: "4px",
        gutter: "24px",
        "container-max": "1440px",
        lg: "40px",
        xl: "64px",
        xs: "8px",
        md: "24px",
        sm: "16px"
      },
      fontFamily: {
        "body-md": ["Sora", "sans-serif"],
        "body-lg": ["Sora", "sans-serif"],
        "display-lg": ["Sora", "sans-serif"],
        "headline-lg": ["Sora", "sans-serif"],
        "headline-md": ["Sora", "sans-serif"],
        "label-md": ["JetBrains Mono", "monospace"],
        "label-sm": ["JetBrains Mono", "monospace"]
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "1.4", letterSpacing: "0.05em", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "1.4", letterSpacing: "0.05em", fontWeight: "500" }]
      }
    }
  },
  plugins: [],
};

export default config;
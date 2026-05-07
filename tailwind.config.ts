import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        rice: "#F7F3EC",
        ink: "#1F1B16",
        cinnabar: "#B53B2A",
        gold: "#C9A35C",
        jade: "#5C7F6B",
        mist: "#E9E2D4"
      },
      fontFamily: {
        serif: ["\"Noto Serif SC\"", "\"Source Han Serif SC\"", "Songti SC", "serif"],
        sans: ["\"PingFang SC\"", "\"Helvetica Neue\"", "system-ui", "sans-serif"]
      },
      boxShadow: {
        scroll: "0 1px 0 rgba(31,27,22,0.06), 0 8px 24px -12px rgba(31,27,22,0.18)"
      }
    }
  },
  plugins: []
};

export default config;

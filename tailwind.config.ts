import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1d252c",
        mist: "#f5f7f8",
        line: "#d9e0e4",
        moss: "#4d6b58",
        copper: "#b8613a",
        gold: "#d6a84f",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(29, 37, 44, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Straight off the Rebuild Auto Group signage.
        // Rule of thumb used throughout: blue builds, red acts.
        brand: {
          red: "#DB2027",
          redDeep: "#B01A20",
          redTint: "#FDEBEC",
          blue: "#123F94",
          blueDeep: "#0C2E6E",
          blueTint: "#E8EEF9",
        },
        ink: "#22262B",
        slate: "#5F6B77",
        mist: "#98A2AC",
        hairline: "#DEE2E6",
        paper: "#F1F3F5",
        // Losses and warnings. Never red — red is the action colour.
        warn: "#B8730A",
        warnTint: "#FBF0DC",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        narrow: ["var(--font-archivo-narrow)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

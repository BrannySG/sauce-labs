import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages serves this project from https://brannysg.github.io/sauce-labs/.
// Use the repo sub-path for production builds and for `npm run preview`
// (which serves the built dist/), and keep "/" for the dev server.
export default defineConfig(({ command }) => {
  const isProductionBase =
    command === "build" || process.env.npm_lifecycle_event === "preview";
  return {
    base: isProductionBase ? "/sauce-labs/" : "/",
    plugins: [react(), tailwindcss()],
  };
});

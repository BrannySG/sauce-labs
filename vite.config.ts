import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Base path strategy:
// - GitHub Actions builds (GITHUB_ACTIONS=true) target GitHub Pages,
//   which serves this project from https://brannysg.github.io/sauce-labs/.
// - Every other production build (Cloudflare, local) targets a domain
//   root, so the base stays "/".
// - The dev server always uses "/" so `npm run dev` is unchanged.
// - `npm run preview` mirrors a Cloudflare-style root build by default.
//   Set GITHUB_ACTIONS=true locally to preview the GitHub Pages build.
export default defineConfig(({ command }) => {
  const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";
  const isProductionBase =
    command === "build" || process.env.npm_lifecycle_event === "preview";
  let base = "/";
  if (isProductionBase && isGitHubPagesBuild) {
    base = "/sauce-labs/";
  }
  return {
    base,
    plugins: [react(), tailwindcss()],
  };
});

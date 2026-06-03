import { defineConfig } from "vite";

// Static build with a relative base so it works at a domain root or under a
// sub-path (e.g. GitHub Pages project pages). Dev server runs on 5174 to avoid
// clashing with the Labs site on 5173.
export default defineConfig({
  base: "./",
  server: {
    port: 5174,
  },
});

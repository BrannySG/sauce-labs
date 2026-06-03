import { defineConfig } from "vite";

// Library build: emits both an ESM module (for `import`) and an IIFE bundle
// that exposes a global `Sauce` (for a plain <script> tag).
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "Sauce",
      formats: ["es", "iife"],
      fileName: (format) => (format === "es" ? "sauce.js" : "sauce.iife.js"),
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});

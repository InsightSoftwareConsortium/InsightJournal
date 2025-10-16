import { defineConfig } from "astro/config";

export default defineConfig({
  // Use the myst-awesome theme configuration
  integrations: [],

  server: {
    port: 4321, // Use port 4321 for the main project
  },

  vite: {
    // Configure module resolution
    ssr: {
      noExternal: ["@awesome.me/webawesome"],
    },
    optimizeDeps: {
      exclude: [
        "itk-wasm",
        "@itk-wasm/mesh-io",
        "@itk-wasm/image-io",
        "@thewtex/zstddec",
      ],
    },
  },
});

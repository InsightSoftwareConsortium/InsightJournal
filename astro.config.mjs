import { defineConfig } from 'astro/config';

export default defineConfig({
  // Use the myst-awesome theme configuration
  integrations: [],

  // Ensure 404.astro is used for 404 pages
  // Astro automatically uses src/pages/404.astro for 404 errors
  // No additional configuration needed for basic 404 routing

  server: {
    port: 4321, // Use port 4321 for the main project
  },

  vite: {
    // Configure module resolution
    ssr: {
      noExternal: ["@awesome.me/webawesome"],
    },
  },
});

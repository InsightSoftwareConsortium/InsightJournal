import { defineConfig } from "astro/config";

// Prevent duplicate customElements.define() errors in dev mode.
// The myst-awesome library imports Web Awesome components from many
// separate <script> entry points, which Astro/Vite can execute more
// than once. This patches define() to silently skip duplicates.
function safeCustomElements() {
  return {
    name: "safe-custom-elements",
    hooks: {
      "astro:config:setup"({ injectScript }) {
        injectScript(
          "head-inline",
          `{
            const orig = customElements.define.bind(customElements);
            customElements.define = function (name, ctor, opts) {
              if (!customElements.get(name)) orig(name, ctor, opts);
            };
          }`
        );
      },
    },
  };
}

export default defineConfig({
  // Use the myst-awesome theme configuration
  integrations: [safeCustomElements()],

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

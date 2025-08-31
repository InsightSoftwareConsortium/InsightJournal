#!/usr/bin/env node
/**
 * Pre-build script for docs to setup scienceicons
 */
import path from "path";
import { fileURLToPath } from "url";
import { setupScienceiconsForDocs } from "@awesome-myst/myst-awesome/utils/scienceicons-setup.mjs";

const __filename = fileURLToPath(import.meta.url);

async function setupDocsAssets() {
  try {
    // Setup scienceicons
    const sourceDir = path.join(path.dirname(__filename), "..", "node_modules", "scienceicons", "24", "solid");
    const docsPublicDir = path.join(path.dirname(__filename), "..", "public");
    const iconBaseUrl = setupScienceiconsForDocs(sourceDir, docsPublicDir);

    if (iconBaseUrl) {
      console.log("🎉 Docs assets setup complete!");
    } else {
      console.log("⚠️ Scienceicons setup skipped (source not found)");
    }
  } catch (error) {
    console.error("❌ Failed to setup docs assets:", error);
    process.exit(1);
  }
}

setupDocsAssets();

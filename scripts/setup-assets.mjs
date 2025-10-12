#!/usr/bin/env node
/**
 * Pre-build script for docs to setup scienceicons
 */
import path from "path";
import { copyScienceIcons } from "@awesome-myst/myst-awesome/scripts/copy-scienceicons.mjs";

async function setupScienceIconsAssets() {
  try {
    // Setup scienceicons
    const sourceDir = path.resolve(
      path.join(process.cwd(), "node_modules", "scienceicons", "24", "solid")
    );
    const publicDir = path.join(process.cwd(), "public");
    const iconBaseUrl = copyScienceIcons(sourceDir, publicDir);

    if (iconBaseUrl) {
      console.log("🎉 Scienceicons assets setup complete!");
    } else {
      console.log("⚠️ Scienceicons setup skipped (source not found)");
    }
  } catch (error) {
    console.error("❌ Failed to setup scienceicons assets:", error);
    process.exit(1);
  }
}

setupScienceIconsAssets();

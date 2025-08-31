// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 NumFOCUS

import { createMystCollections } from "@awesome-myst/myst-astro-collections";

// Create MyST collections with custom configuration
export const collections = createMystCollections({
  server: {
    baseUrl: "https://insight-test.desci.com",
    timeout: 10000,
    // Enable fuse index generation for search
    generateSearchIndex: true,
    includeKeywords: true,
  },
  project: {
    // Load configuration from myst.yml
    configPath: "myst.yml",
  },
});

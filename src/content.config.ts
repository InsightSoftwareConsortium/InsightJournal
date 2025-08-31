// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 NumFOCUS

import { createMystCollections, createPagesLoader, type MystServerConfig, type ProjectConfig } from "@awesome-myst/myst-astro-collections";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { parse } from "yaml";
import { resolve, dirname, join, basename } from "node:path";

// Simple function to read articles from myst.yml
function getArticlesFromConfig(projectConfig: ProjectConfig = {}): number[] | null {
  try {
    const configPath = projectConfig.configPath ? resolve(projectConfig.configPath) : resolve(process.cwd(), 'myst.yml');
    if (!existsSync(configPath)) {
      return null;
    }

    const fileContent = readFileSync(configPath, 'utf-8');
    const config = parse(fileContent);

    const articles = config?.site?.options?.articles;
    if (Array.isArray(articles) && articles.length > 0) {
      const validArticles = articles.filter((id: any) => typeof id === 'number' && Number.isInteger(id));
      return validArticles.length > 0 ? validArticles : null;
    }
    return null;
  } catch (error) {
    console.warn('Failed to read articles from myst.yml:', error);
    return null;
  }
}

const server: MystServerConfig = {
  baseUrl: "https://insight-test.desci.com",
  timeout: 10000,
  // Enable fuse index generation for search
  generateSearchIndex: true,
  includeKeywords: true,
  pageConcurrency: 8,
}

const project: ProjectConfig = {
  // Load configuration from myst.yml
  configPath: "myst.yml",
}

// Create MyST collections with custom configuration
const baseCollections = createMystCollections({
  server,
  project
});

// Custom pages loader that supports article filtering
const createFilteredPagesLoader = (serverConfig: MystServerConfig = {}, projectConfig: ProjectConfig = {}) => {
  const articles = getArticlesFromConfig(projectConfig);

  if (articles && articles.length > 0) {
    return async () => {
      console.log(`Loading ${articles.length} specific articles from DPID endpoint:`, articles);

      const articlePromises = articles.map(async (articleId: number) => {
        try {
          console.log(`Fetching article ${articleId} from https://dev-beta.dpid.org/${articleId}?format=myst`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`https://dev-beta.dpid.org/${articleId}?format=myst`, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`Failed to fetch article ${articleId}: ${response.status}`);
            return null;
          }

          const pageData = await response.json();
          console.log(`Successfully fetched article ${articleId}`);

          // Create a synthetic reference object for consistency
          const syntheticRef = {
            url: `/browse/publication/${articleId}`,
            kind: "page",
            identifier: `dpid-${articleId}`,
            data: `https://dev-beta.dpid.org/${articleId}?format=myst`
          };

          // Todo: call processThumbnails

          // Todo: fix upstream, does not follow schema
          pageData.references = {
            cite: {
              order: [],
              data: {}
            }
          }

          const publicDir = resolve(process.cwd(), "public");
          const urlPath = String(syntheticRef.url).replace(/^\/+/ , ""); // strip leading '/'
          const targetPath = join(publicDir, `${urlPath}.json`);
          const targetDir = dirname(targetPath);
          if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
          }
          writeFileSync(targetPath, JSON.stringify(pageData, null), "utf-8");
          console.log(`✓ Saved page JSON to ${targetPath}`);

          return {
            id: syntheticRef.url,
            ...syntheticRef,
            ...pageData,
          };

        } catch (error) {
          console.warn(`Failed to load article ${articleId}:`, error);
          return createPagesLoader(serverConfig)();
        }
      });

      const results = await Promise.all(articlePromises);
      const validArticles = results.filter(result => result !== null);

      console.log(`Successfully loaded ${validArticles.length} articles from DPID endpoint`);
      return validArticles;
    }
  } else {
    console.log("No articles specified, using default pages loader");
    return createPagesLoader(serverConfig);
  }
};

const modifiedCollections = { ...baseCollections }
modifiedCollections.pages = {
  ...baseCollections.pages
};
const filteredPagesLoader = createFilteredPagesLoader(server, project);
modifiedCollections.pages.loader = filteredPagesLoader;

export const collections = modifiedCollections;

// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 NumFOCUS, Inc.

import {
  createMystCollections,
  createPagesLoader,
  type MystServerConfig,
  type ProjectConfig,
} from "@awesome-myst/myst-astro-collections";
import { pageSchema } from "@awesome-myst/myst-zod";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { parse } from "yaml";
import { resolve, dirname, join, basename } from "node:path";

/**
 * Extract all CIDs from a string (URL or text)
 * Supports both /ipfs/<cid> and /ipns/<cid> patterns
 */
function extractCIDsFromString(text: string): string[] {
  const cidPattern = /\/(ipfs|ipns)\/([a-zA-Z0-9]+)/g;
  const cids: string[] = [];
  let match;

  while ((match = cidPattern.exec(text)) !== null) {
    cids.push(match[2]);
  }

  return cids;
}

/**
 * Recursively extract all CIDs from an object
 */
function extractAllCIDs(obj: any, visited = new Set()): string[] {
  if (obj === null || obj === undefined) {
    return [];
  }

  // Prevent infinite recursion
  if (typeof obj === "object" && visited.has(obj)) {
    return [];
  }

  if (typeof obj === "object") {
    visited.add(obj);
  }

  const cids: string[] = [];

  if (typeof obj === "string") {
    cids.push(...extractCIDsFromString(obj));
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      cids.push(...extractAllCIDs(item, visited));
    }
  } else if (typeof obj === "object") {
    for (const value of Object.values(obj)) {
      cids.push(...extractAllCIDs(value, visited));
    }
  }

  return cids;
}

/**
 * Generate archive for an article
 * 1. Saves pageData to archive/myst/${articleId}.json
 * 2. Downloads all files from downloads[] to archive/downloads/${articleId}/${filename}
 * 3. Extracts and saves all CIDs to archive/pins/${articleId}.json
 */
async function generateArticleArchive(
  articleId: number,
  pageData: any,
  archiveBasePath: string
): Promise<void> {
  console.log(`Generating archive for article ${articleId}...`);

  try {
    // 1. Save pageData to archive/myst/${articleId}.json
    const mystDir = join(archiveBasePath, "myst");
    if (!existsSync(mystDir)) {
      mkdirSync(mystDir, { recursive: true });
    }

    const mystPath = join(mystDir, `${articleId}.json`);
    writeFileSync(mystPath, JSON.stringify(pageData, null, 2), "utf-8");
    console.log(`✓ Saved pageData to ${mystPath}`);

    // 2. Download all files from downloads
    if (pageData.downloads && Array.isArray(pageData.downloads)) {
      const downloadsDir = join(
        archiveBasePath,
        "downloads",
        articleId.toString()
      );
      if (!existsSync(downloadsDir)) {
        mkdirSync(downloadsDir, { recursive: true });
      }

      for (const download of pageData.downloads) {
        if (download.url && download.filename) {
          try {
            console.log(
              `  Downloading ${download.filename} from ${download.url}`
            );

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(download.url, {
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const filePath = join(downloadsDir, download.filename);
              writeFileSync(filePath, Buffer.from(buffer));
              console.log(
                `  ✓ Downloaded ${download.filename} (${buffer.byteLength} bytes)`
              );
            } else {
              console.warn(
                `  ✗ Failed to download ${download.filename}: ${response.status}`
              );
            }
          } catch (error) {
            console.warn(`  ✗ Error downloading ${download.filename}:`, error);
          }
        }
      }
    }

    // 3. Extract all CIDs and save to archive/pins/${articleId}.json
    const allCIDs = extractAllCIDs(pageData);

    // Explicitly include revision_cids if present
    if (
      pageData.frontmatter?.revision_cids &&
      Array.isArray(pageData.frontmatter.revision_cids)
    ) {
      allCIDs.push(...pageData.frontmatter.revision_cids);
      console.log(
        `  Found ${pageData.frontmatter.revision_cids.length} revision CIDs`
      );
    }

    const uniqueCIDs = Array.from(new Set(allCIDs));

    const pinsDir = join(archiveBasePath, "pins");
    if (!existsSync(pinsDir)) {
      mkdirSync(pinsDir, { recursive: true });
    }

    const pinsPath = join(pinsDir, `${articleId}.json`);
    writeFileSync(pinsPath, JSON.stringify(uniqueCIDs, null, 2), "utf-8");
    console.log(`✓ Saved ${uniqueCIDs.length} unique CIDs to ${pinsPath}`);

    console.log(`✓ Archive generation complete for article ${articleId}`);
  } catch (error) {
    console.error(
      `✗ Failed to generate archive for article ${articleId}:`,
      error
    );
    throw error;
  }
}

// Simple function to read articles from myst.yml
function getArticlesFromConfig(
  projectConfig: ProjectConfig = {}
): number[] | null {
  try {
    const configPath = projectConfig.configPath
      ? resolve(projectConfig.configPath)
      : resolve(process.cwd(), "myst.yml");
    if (!existsSync(configPath)) {
      return null;
    }

    const fileContent = readFileSync(configPath, "utf-8");
    const config = parse(fileContent);

    const articles = config?.site?.options?.articles;
    if (Array.isArray(articles) && articles.length > 0) {
      const validArticles = articles.filter(
        (id: any) => typeof id === "number" && Number.isInteger(id)
      );
      return validArticles.length > 0 ? validArticles : null;
    }
    return null;
  } catch (error) {
    console.warn("Failed to read articles from myst.yml:", error);
    return null;
  }
}

type InsightJournalMystConfig = MystServerConfig & {
  generateArchive?: boolean;
  archivePath?: string; // Path to save the generated archive
};

const server: InsightJournalMystConfig = {
  baseUrl: "https://insight-test.desci.com",
  timeout: 10000,
  // Enable fuse index generation for search
  generateSearchIndex: false,
  includeKeywords: true,
  pageConcurrency: 8,
  generateArchive: false,
  archivePath: resolve(process.cwd(), "archive"),
};

const project: ProjectConfig = {
  // Load configuration from myst.yml
  configPath: "myst.yml",
};

// Create MyST collections with custom configuration
const baseCollections = createMystCollections({
  server,
  project,
});

// Custom pages loader that supports article filtering
const createFilteredPagesLoader = (
  serverConfig: InsightJournalMystConfig = {},
  projectConfig: ProjectConfig = {}
) => {
  const articles = getArticlesFromConfig(projectConfig);

  if (articles && articles.length > 0) {
    return async () => {
      console.log(
        `Loading ${articles.length} specific articles from DPID endpoint:`,
        articles
      );

      const articlePromises = articles.map(async (articleId: number) => {
        try {
          console.log(
            `Fetching article ${articleId} from https://dev-beta.dpid.org/${articleId}?format=myst`
          );

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(
            `https://dev-beta.dpid.org/${articleId}?format=myst`,
            {
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(
              `Failed to fetch article ${articleId}: ${response.status}`
            );
            return null;
          }

          const pageData = await response.json();
          console.log(`Successfully fetched article ${articleId}`);

          // Todo: fix upstream
          pageData.references = {
            cite: {
              order: [],
              data: {},
            },
          };

          // console.log("pageData", pageData);

          // Generate archive if enabled
          const archivePath =
            serverConfig.archivePath || resolve(process.cwd(), "archive");
          if (serverConfig.generateArchive && archivePath) {
            try {
              await generateArticleArchive(articleId, pageData, archivePath);
            } catch (error) {
              console.error(
                `Failed to generate archive for article ${articleId}:`,
                error
              );
              // Continue even if archive generation fails
            }
          }

          const insightJournalId =
            pageData.frontmatter?.external_publication_id;
          if (insightJournalId) {
            console.log(
              `✓ Article ${articleId} has external_publication_id: ${insightJournalId}`
            );
          } else {
            console.error(
              `✗ Article ${articleId} is missing external_publication_id in frontmatter`
            );
            // fail
            return null;
          }

          // Create a synthetic reference object for consistency
          const syntheticRef = {
            url: `/browse/publication/${insightJournalId}`,
            kind: "page",
            identifier: `dpid-${articleId}`,
            data: `https://dev-beta.dpid.org/${articleId}?format=myst`,
          };

          // Todo: call processThumbnails

          const publicDir = resolve(process.cwd(), "public");
          const urlPath = String(syntheticRef.url).replace(/^\/+/, ""); // strip leading '/'
          const targetPath = join(publicDir, `${urlPath}.json`);
          const targetDir = dirname(targetPath);
          if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
          }
          writeFileSync(targetPath, JSON.stringify(pageData, null), "utf-8");
          console.log(`✓ Saved page JSON to ${targetPath}`);

          // Download article.pdf to public/pdfs/${insightJournalId}.pdf
          if (pageData.downloads && Array.isArray(pageData.downloads)) {
            const articlePdfDownload = pageData.downloads.find(
              (download: any) => download.title === "root/article.pdf"
            );

            if (articlePdfDownload && articlePdfDownload.url) {
              try {
                console.log(
                  `Downloading article.pdf for ${insightJournalId} from ${articlePdfDownload.url}`
                );

                const pdfController = new AbortController();
                const pdfTimeoutId = setTimeout(
                  () => pdfController.abort(),
                  30000
                );

                const pdfResponse = await fetch(articlePdfDownload.url, {
                  signal: pdfController.signal,
                });

                clearTimeout(pdfTimeoutId);

                if (pdfResponse.ok) {
                  const pdfBuffer = await pdfResponse.arrayBuffer();
                  const pdfsDir = join(publicDir, "pdfs");
                  if (!existsSync(pdfsDir)) {
                    mkdirSync(pdfsDir, { recursive: true });
                  }

                  const pdfPath = join(pdfsDir, `${insightJournalId}.pdf`);
                  writeFileSync(pdfPath, Buffer.from(pdfBuffer));
                  console.log(
                    `✓ Downloaded article.pdf to ${pdfPath} (${pdfBuffer.byteLength} bytes)`
                  );
                } else {
                  console.warn(
                    `✗ Failed to download article.pdf: ${pdfResponse.status}`
                  );
                }
              } catch (error) {
                console.warn(`✗ Error downloading article.pdf:`, error);
              }
            } else {
              console.warn(
                `✗ No download with title "root/article.pdf" found for article ${insightJournalId}`
              );
            }
          }

          return {
            id: insightJournalId.toString(),
            ...syntheticRef,
            ...pageData,
          };
        } catch (error) {
          console.warn(`Failed to load article ${articleId}:`, error);
          return createPagesLoader(serverConfig)();
        }
      });

      const results = await Promise.all(articlePromises);
      const validArticles = results.filter((result) => result !== null);

      console.log(
        `Successfully loaded ${validArticles.length} articles from DPID endpoint`
      );
      return validArticles;
    };
  } else {
    console.log("No articles specified, using default pages loader");
    return createPagesLoader(serverConfig);
  }
};

const modifiedCollections = { ...baseCollections };
modifiedCollections.pages = {
  ...baseCollections.pages,
};
const filteredPagesLoader = createFilteredPagesLoader(server, project);
modifiedCollections.pages.loader = filteredPagesLoader;
// Remove schema to use default passthrough behavior
delete modifiedCollections.pages.schema;

export const collections = modifiedCollections;

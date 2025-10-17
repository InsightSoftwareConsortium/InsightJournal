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
 * 3. Downloads thumbnail to archive/thumbnails/${articleId}.jpg if present
 * 4. Extracts and saves all CIDs to archive/pins/${articleId}.json
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

    // 2. Download thumbnail if present
    if (pageData.frontmatter?.thumbnail) {
      const thumbnailsDir = join(archiveBasePath, "thumbnails");
      if (!existsSync(thumbnailsDir)) {
        mkdirSync(thumbnailsDir, { recursive: true });
      }

      try {
        console.log(
          `  Downloading thumbnail from ${pageData.frontmatter.thumbnail}`
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(pageData.frontmatter.thumbnail, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const thumbnailPath = join(thumbnailsDir, `${articleId}.jpg`);
          writeFileSync(thumbnailPath, Buffer.from(buffer));
          console.log(`  ✓ Downloaded thumbnail (${buffer.byteLength} bytes)`);
        } else {
          console.warn(`  ✗ Failed to download thumbnail: ${response.status}`);
        }
      } catch (error) {
        console.warn(`  ✗ Error downloading thumbnail:`, error);
      }
    }

    // 3. Download all files from downloads
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

    // 4. Extract all CIDs and save to archive/pins/${articleId}.json
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

    // Extract CIDs from thumbnail URL if present
    if (pageData.frontmatter?.thumbnail) {
      const thumbnailCIDs = extractCIDsFromString(
        pageData.frontmatter.thumbnail
      );
      if (thumbnailCIDs.length > 0) {
        allCIDs.push(...thumbnailCIDs);
        console.log(`  Found ${thumbnailCIDs.length} CID(s) in thumbnail URL`);
      }
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

/**
 * Fetch all article IDs from myst.xref.json
 */
async function getAllArticles(baseUrl: string): Promise<number[]> {
  try {
    const xrefUrl = `${baseUrl}/myst.xref.json`;
    console.log(`Fetching all articles from ${xrefUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(xrefUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch myst.xref.json: ${response.status}`);
      return [];
    }

    const xrefData = await response.json();

    if (!xrefData.references || !Array.isArray(xrefData.references)) {
      console.warn("Invalid myst.xref.json format: missing references array");
      return [];
    }

    const articleIds: number[] = [];
    for (const ref of xrefData.references) {
      if (ref.identifier && typeof ref.identifier === "string") {
        const match = ref.identifier.match(/^dpid-(\d+)$/);
        if (match) {
          const articleId = parseInt(match[1], 10);
          if (!isNaN(articleId)) {
            articleIds.push(articleId);
          }
        }
      }
    }

    console.log(`Found ${articleIds.length} articles in myst.xref.json`);
    return articleIds;
  } catch (error) {
    console.warn("Failed to fetch all articles from myst.xref.json:", error);
    return [];
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
  generateArchive: true,
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
  return async () => {
    let articles = getArticlesFromConfig(projectConfig);

    if (!articles || articles.length === 0) {
      console.log("No articles in myst.yml, fetching all from myst.xref.json");
      const baseUrl = serverConfig.baseUrl || "https://insight-test.desci.com";
      articles = await getAllArticles(baseUrl);

      if (!articles || articles.length === 0) {
        console.warn("No articles found in myst.xref.json");
        return [];
      }
    }

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
        // pageData.references = {
        //   cite: {
        //     order: [],
        //     data: {},
        //   },
        // };

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

        const insightJournalId = pageData.frontmatter?.external_publication_id;
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

          // Fetch insight-journal-metadata.json and merge tags into keywords
          const metadataDownload = pageData.downloads.find(
            (download: any) =>
              download.title === "root/insight-journal-metadata.json"
          );

          if (metadataDownload && metadataDownload.url) {
            try {
              console.log(
                `Fetching insight-journal-metadata.json for ${insightJournalId} from ${metadataDownload.url}`
              );

              const metadataController = new AbortController();
              const metadataTimeoutId = setTimeout(
                () => metadataController.abort(),
                10000
              );

              const metadataResponse = await fetch(metadataDownload.url, {
                signal: metadataController.signal,
              });

              clearTimeout(metadataTimeoutId);

              if (metadataResponse.ok) {
                const metadataJson = await metadataResponse.json();
                console.log(
                  `✓ Fetched insight-journal-metadata.json for ${insightJournalId}`
                );

                // Merge tags into keywords
                if (metadataJson.tags && Array.isArray(metadataJson.tags)) {
                  // Initialize keywords array if it doesn't exist
                  if (!pageData.frontmatter) {
                    pageData.frontmatter = {};
                  }
                  if (!Array.isArray(pageData.frontmatter.keywords)) {
                    pageData.frontmatter.keywords = [];
                  }

                  // Add tags to keywords if not already present
                  const existingKeywords = new Set(
                    pageData.frontmatter.keywords.map((k: string) =>
                      k.toLowerCase()
                    )
                  );

                  for (const tag of metadataJson.tags) {
                    if (
                      typeof tag === "string" &&
                      !existingKeywords.has(tag.toLowerCase())
                    ) {
                      pageData.frontmatter.keywords.push(tag);
                      existingKeywords.add(tag.toLowerCase());
                    }
                  }

                  console.log(
                    `✓ Added ${metadataJson.tags.length} tags to keywords (now ${pageData.frontmatter.keywords.length} total)`
                  );
                }

                // Set github property from source_code_git_repo if it contains "github.com"
                if (
                  metadataJson.source_code_git_repo &&
                  typeof metadataJson.source_code_git_repo === "string" &&
                  metadataJson.source_code_git_repo.includes("github.com")
                ) {
                  if (!pageData.frontmatter) {
                    pageData.frontmatter = {};
                  }
                  pageData.frontmatter.github =
                    metadataJson.source_code_git_repo;
                  console.log(
                    `✓ Set github property to: ${metadataJson.source_code_git_repo}`
                  );
                }
              } else {
                console.warn(
                  `✗ Failed to fetch insight-journal-metadata.json: ${metadataResponse.status}`
                );
              }
            } catch (error) {
              console.warn(
                `✗ Error fetching insight-journal-metadata.json:`,
                error
              );
            }
          }

          // Download thumbnail to public/thumbnails/${insightJournalId}.jpg
          if (pageData.frontmatter?.thumbnail) {
            try {
              console.log(
                `Downloading thumbnail for ${insightJournalId} from ${pageData.frontmatter.thumbnail}`
              );

              const thumbnailController = new AbortController();
              const thumbnailTimeoutId = setTimeout(
                () => thumbnailController.abort(),
                30000
              );

              const thumbnailResponse = await fetch(
                pageData.frontmatter.thumbnail,
                {
                  signal: thumbnailController.signal,
                }
              );

              clearTimeout(thumbnailTimeoutId);

              if (thumbnailResponse.ok) {
                const thumbnailBuffer = await thumbnailResponse.arrayBuffer();
                const thumbnailsDir = join(publicDir, "thumbnails");
                if (!existsSync(thumbnailsDir)) {
                  mkdirSync(thumbnailsDir, { recursive: true });
                }

                const thumbnailPath = join(
                  thumbnailsDir,
                  `${insightJournalId}.jpg`
                );
                writeFileSync(thumbnailPath, Buffer.from(thumbnailBuffer));
                console.log(
                  `✓ Downloaded thumbnail to ${thumbnailPath} (${thumbnailBuffer.byteLength} bytes)`
                );
              } else {
                console.warn(
                  `✗ Failed to download thumbnail: ${thumbnailResponse.status}`
                );
              }
            } catch (error) {
              console.warn(`✗ Error downloading thumbnail:`, error);
            }
          }

          // Write pageData.downloads to ${publicDir}/downloads/${insightJournalId}.json
          if (pageData.downloads && Array.isArray(pageData.downloads)) {
            try {
              const downloadsDir = join(publicDir, "downloads");
              if (!existsSync(downloadsDir)) {
                mkdirSync(downloadsDir, { recursive: true });
              }

              const downloadsPath = join(
                downloadsDir,
                `${insightJournalId}.json`
              );
              writeFileSync(
                downloadsPath,
                JSON.stringify(pageData.downloads, null, 2),
                "utf-8"
              );
              console.log(
                `✓ Saved downloads to ${downloadsPath} (${pageData.downloads.length} items)`
              );
            } catch (error) {
              console.warn(
                `✗ Error writing downloads JSON for ${insightJournalId}:`,
                error
              );
            }
          }
        }

        const urlPath = String(syntheticRef.url).replace(/^\/+/, ""); // strip leading '/'
        const targetPath = join(publicDir, `${urlPath}.json`);
        const targetDir = dirname(targetPath);
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }
        writeFileSync(targetPath, JSON.stringify(pageData, null), "utf-8");
        console.log(`✓ Saved page JSON to ${targetPath}`);

        return {
          id: insightJournalId.toString(),
          ...syntheticRef,
          ...pageData,
        };
      } catch (error) {
        console.warn(`Failed to load article ${articleId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(articlePromises);
    const validArticles = results.filter((result) => result !== null);

    console.log(
      `Successfully loaded ${validArticles.length} articles from DPID endpoint`
    );
    return validArticles;
  };
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

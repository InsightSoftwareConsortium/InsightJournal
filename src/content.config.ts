// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 NumFOCUS, Inc.

import {
  createMystCollections,
  type MystServerConfig,
  type ProjectConfig,
} from "@awesome-myst/myst-astro-collections";
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import { resolve, dirname, join, basename } from "node:path";

type InsightJournalMystConfig = MystServerConfig & {
  useCache?: boolean; // Use local cache instead of network fetches
  cachePath?: string; // Path to the cache directory
};

type CacheMapping = {
  dpidToInsightJournal: Record<string, number>;
  insightJournalToDpid: Record<string, number>;
  lastUpdated: string;
};

/**
 * Create a cache loader function for fuse.json generation.
 * This implements InsightJournal-specific logic for mapping DPID identifiers
 * to Insight Journal IDs and loading from the local cache.
 * 
 * @param cachePath - Path to the cache directory
 * @returns Async function that loads page data from cache by identifier
 */
function createCacheLoader(
  cachePath: string
): (identifier: string) => Promise<any | null> {
  // Load mapping once at startup
  const mappingPath = join(cachePath, "myst", "mapping.json");
  let mapping: CacheMapping | null = null;

  if (existsSync(mappingPath)) {
    try {
      const content = readFileSync(mappingPath, "utf-8");
      mapping = JSON.parse(content) as CacheMapping;
    } catch {
      mapping = null;
    }
  }

  // Return the async loader function
  return async (identifier: string): Promise<any | null> => {
    if (!mapping) return null;

    // Extract DPID number from identifier (e.g., "dpid-390" -> "390")
    const match = identifier.match(/^dpid-(\d+)$/);
    if (!match || !match[1]) return null;

    const dpid = match[1];
    const insightJournalId = mapping.dpidToInsightJournal[dpid];
    if (!insightJournalId) return null;

    const cacheFilePath = join(cachePath, "myst", `${insightJournalId}.json`);
    if (!existsSync(cacheFilePath)) return null;

    try {
      const content = readFileSync(cacheFilePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  };
}

const cachePath = resolve(process.cwd(), "cache");

const server: InsightJournalMystConfig = {
  baseUrl: "https://insight-test.desci.com",
  timeout: 15000,
  // Enable fuse index generation for search
  generateSearchIndex: true,
  includeKeywords: true,
  pageConcurrency: 4,
  // Cache settings for custom pages loader
  useCache: true,
  cachePath: cachePath,
  // Cache loader for fuse.json generation (uses same cache)
  cacheLoader: createCacheLoader(cachePath),
};

const project: ProjectConfig = {
  // Load configuration from myst.yml
  configPath: "myst.yml",
};

/**
 * Load cache mapping from cache/myst/mapping.json
 */
function loadCacheMapping(cachePath: string): CacheMapping | null {
  const mappingPath = join(cachePath, "myst", "mapping.json");

  if (!existsSync(mappingPath)) {
    return null;
  }

  try {
    const content = readFileSync(mappingPath, "utf-8");
    const mapping = JSON.parse(content) as CacheMapping;
    return mapping;
  } catch (error) {
    console.warn(`Failed to read cache mapping from ${mappingPath}:`, error);
    return null;
  }
}

/**
 * Save cache mapping to cache/myst/mapping.json
 */
function saveCacheMapping(cachePath: string, mapping: CacheMapping): void {
  const mystCacheDir = join(cachePath, "myst");
  if (!existsSync(mystCacheDir)) {
    mkdirSync(mystCacheDir, { recursive: true });
  }

  const mappingPath = join(mystCacheDir, "mapping.json");
  mapping.lastUpdated = new Date().toISOString();

  try {
    writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), "utf-8");
  } catch (error) {
    console.error(`Failed to save cache mapping to ${mappingPath}:`, error);
    throw error;
  }
}

/**
 * Update cache mapping with a new DPID <-> Insight Journal ID pair
 */
function updateCacheMapping(
  cachePath: string,
  dpid: number,
  insightJournalId: number
): void {
  let mapping = loadCacheMapping(cachePath);

  if (!mapping) {
    mapping = {
      dpidToInsightJournal: {},
      insightJournalToDpid: {},
      lastUpdated: "",
    };
  }

  // Update bidirectional mapping
  mapping.dpidToInsightJournal[dpid.toString()] = insightJournalId;
  mapping.insightJournalToDpid[insightJournalId.toString()] = dpid;

  saveCacheMapping(cachePath, mapping);
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
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  timeout: number = 60000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `Fetch attempt ${attempt}/${maxRetries} failed for ${url}:`,
        error
      );

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw (
    lastError ||
    new Error(`Failed to fetch ${url} after ${maxRetries} attempts`)
  );
}

/**
 * Fetch all article IDs from myst.xref.json
 */
async function getAllArticles(baseUrl: string): Promise<number[]> {
  try {
    const xrefUrl = `${baseUrl}/myst.xref.json`;
    console.log(`Fetching all articles from ${xrefUrl}`);

    const response = await fetchWithRetry(xrefUrl);

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
// Create MyST collections with custom configuration
const baseCollections = createMystCollections({
  server,
  project,
});

/**
 * Load article from local cache using mapping to find Insight Journal ID
 */
function loadArticleFromCache(
  articleId: number,
  cachePath: string
): any | null {
  const mapping = loadCacheMapping(cachePath);

  // Need mapping to find the correct file
  if (!mapping || !mapping.dpidToInsightJournal[articleId.toString()]) {
    return null;
  }

  const insightJournalId = mapping.dpidToInsightJournal[articleId.toString()];
  const mystCachePath = join(cachePath, "myst", `${insightJournalId}.json`);

  if (existsSync(mystCachePath)) {
    try {
      const content = readFileSync(mystCachePath, "utf-8");
      const pageData = JSON.parse(content);
      console.log(
        `✓ Loaded article ${articleId} (IJ-${insightJournalId}) from cache`
      );
      return pageData;
    } catch (error) {
      console.warn(`Failed to read cache for article ${articleId}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Get list of cached article IDs (DPIDs) from the mapping file
 */
function getCachedArticleIds(cachePath: string): number[] {
  const mapping = loadCacheMapping(cachePath);

  if (!mapping) {
    return [];
  }

  try {
    const dpids = Object.keys(mapping.dpidToInsightJournal)
      .map((dpid) => parseInt(dpid, 10))
      .filter((id) => !isNaN(id))
      .sort((a, b) => a - b);

    return dpids;
  } catch (error) {
    console.warn("Failed to read cached article IDs from mapping:", error);
    return [];
  }
}

/**
 * Copy cached assets to public directory
 */
function copyCachedAssets(
  insightJournalId: number,
  cachePath: string,
  publicDir: string
): void {
  // Copy PDF
  const cachedPdfPath = join(cachePath, "pdfs", `${insightJournalId}.pdf`);
  if (existsSync(cachedPdfPath)) {
    const pdfsDir = join(publicDir, "pdfs");
    if (!existsSync(pdfsDir)) {
      mkdirSync(pdfsDir, { recursive: true });
    }
    const destPdfPath = join(pdfsDir, `${insightJournalId}.pdf`);
    const pdfBuffer = readFileSync(cachedPdfPath);
    writeFileSync(destPdfPath, pdfBuffer);
    console.log(`  ✓ Copied PDF from cache`);
  }

  // Copy thumbnail
  const cachedThumbnailPath = join(
    cachePath,
    "thumbnails",
    `${insightJournalId}.jpg`
  );
  if (existsSync(cachedThumbnailPath)) {
    const thumbnailsDir = join(publicDir, "thumbnails");
    if (!existsSync(thumbnailsDir)) {
      mkdirSync(thumbnailsDir, { recursive: true });
    }
    const destThumbnailPath = join(thumbnailsDir, `${insightJournalId}.jpg`);
    const thumbnailBuffer = readFileSync(cachedThumbnailPath);
    writeFileSync(destThumbnailPath, thumbnailBuffer);
    console.log(`  ✓ Copied thumbnail from cache`);
  }

  // Copy downloads JSON
  const cachedDownloadsPath = join(
    cachePath,
    "downloads",
    `${insightJournalId}.json`
  );
  if (existsSync(cachedDownloadsPath)) {
    const downloadsDir = join(publicDir, "downloads");
    if (!existsSync(downloadsDir)) {
      mkdirSync(downloadsDir, { recursive: true });
    }
    const destDownloadsPath = join(downloadsDir, `${insightJournalId}.json`);
    const downloadsContent = readFileSync(cachedDownloadsPath, "utf-8");
    writeFileSync(destDownloadsPath, downloadsContent, "utf-8");
    console.log(`  ✓ Copied downloads list from cache`);
  }
}

// Custom pages loader that supports article filtering
const createFilteredPagesLoader = (
  serverConfig: InsightJournalMystConfig = {},
  projectConfig: ProjectConfig = {}
) => {
  return async () => {
    const useCache = serverConfig.useCache ?? true;
    const cachePath =
      serverConfig.cachePath || resolve(process.cwd(), "cache");

    let articles = getArticlesFromConfig(projectConfig);

    // If using cache, prefer cached article list
    if (useCache && (!articles || articles.length === 0)) {
      const cachedArticles = getCachedArticleIds(cachePath);
      if (cachedArticles.length > 0) {
        console.log(
          `Found ${cachedArticles.length} cached articles, using cache`
        );
        articles = cachedArticles;
      }
    }

    if (!articles || articles.length === 0) {
      console.log("No articles in myst.yml or cache, fetching from myst.xref.json");
      const baseUrl = serverConfig.baseUrl || "https://insight-test.desci.com";
      articles = await getAllArticles(baseUrl);

      if (!articles || articles.length === 0) {
        console.warn("No articles found in myst.xref.json");
        return [];
      }
    }

    console.log(
      `Loading ${articles.length} articles (cache: ${useCache ? "enabled" : "disabled"})`
    );

    const articlePromises = articles.map(async (articleId: number) => {
      try {
        let pageData: any = null;

        // Try to load from cache first
        if (useCache) {
          pageData = loadArticleFromCache(articleId, cachePath);
        }

        // Fall back to network fetch if not in cache
        if (!pageData) {
          console.log(
            `Fetching article ${articleId} from https://dev-beta.dpid.org/${articleId}?format=myst`
          );

          const response = await fetchWithRetry(
            `https://dev-beta.dpid.org/${articleId}?format=myst`
          );

          if (!response.ok) {
            console.warn(
              `Failed to fetch article ${articleId}: ${response.status}`
            );
            return null;
          }

          pageData = await response.json();
          console.log(`Successfully fetched article ${articleId} from network`);

          // Validate that external_publication_id exists before caching
          const insightJournalId = pageData.frontmatter?.external_publication_id;
          if (!insightJournalId) {
            console.error(
              `✗ Article ${articleId} is missing external_publication_id in frontmatter`
            );
            throw new Error(
              `Article ${articleId} is missing external_publication_id in frontmatter. Build cannot continue.`
            );
          }

          // Write to cache using Insight Journal ID
          const mystCacheDir = join(cachePath, "myst");
          if (!existsSync(mystCacheDir)) {
            mkdirSync(mystCacheDir, { recursive: true });
          }

          const cacheFilePath = join(mystCacheDir, `${insightJournalId}.json`);
          writeFileSync(
            cacheFilePath,
            JSON.stringify(pageData, null, 2),
            "utf-8"
          );
          console.log(`✓ Cached article to ${cacheFilePath}`);

          // Update mapping
          updateCacheMapping(cachePath, articleId, insightJournalId);
        }

        // Todo: fix upstream
        // pageData.references = {
        //   cite: {
        //     order: [],
        //     data: {},
        //   },
        // };

        // console.log("pageData", pageData);

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
          throw new Error(
            `Article ${articleId} is missing external_publication_id in frontmatter. Build cannot continue.`
          );
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

        // Try to copy assets from cache first
        let assetsCopiedFromCache = false;
        if (useCache) {
          const cachedPdfPath = join(cachePath, "pdfs", `${insightJournalId}.pdf`);
          const cachedThumbnailPath = join(cachePath, "thumbnails", `${insightJournalId}.jpg`);
          const cachedDownloadsPath = join(cachePath, "downloads", `${insightJournalId}.json`);

          if (existsSync(cachedPdfPath) || existsSync(cachedThumbnailPath) || existsSync(cachedDownloadsPath)) {
            copyCachedAssets(insightJournalId, cachePath, publicDir);
            assetsCopiedFromCache = true;
          }
        }

        // Download assets from network if not cached
        if (!assetsCopiedFromCache && pageData.downloads && Array.isArray(pageData.downloads)) {
          // First try to find root/article.pdf
          let articlePdfDownload = pageData.downloads.find(
            (download: any) => download.title === "root/article.pdf"
          );

          // If not found, look for the first file ending with .pdf
          if (!articlePdfDownload) {
            articlePdfDownload = pageData.downloads.find(
              (download: any) =>
                download.title &&
                typeof download.title === "string" &&
                download.title.toLowerCase().endsWith(".pdf")
            );

            if (articlePdfDownload) {
              console.log(
                `ℹ root/article.pdf not found, using fallback: ${articlePdfDownload.title}`
              );
            }
          }

          if (articlePdfDownload && articlePdfDownload.url) {
            try {
              console.log(
                `Downloading article.pdf for ${insightJournalId} from ${articlePdfDownload.url}`
              );

              const pdfResponse = await fetchWithRetry(articlePdfDownload.url);

              if (pdfResponse.ok) {
                const pdfBuffer = await pdfResponse.arrayBuffer();
                const buffer = Buffer.from(pdfBuffer);

                // Write to public directory
                const pdfsDir = join(publicDir, "pdfs");
                if (!existsSync(pdfsDir)) {
                  mkdirSync(pdfsDir, { recursive: true });
                }
                const pdfPath = join(pdfsDir, `${insightJournalId}.pdf`);
                writeFileSync(pdfPath, buffer);

                // Write to cache directory
                const cachedPdfsDir = join(cachePath, "pdfs");
                if (!existsSync(cachedPdfsDir)) {
                  mkdirSync(cachedPdfsDir, { recursive: true });
                }
                const cachedPdfPath = join(
                  cachedPdfsDir,
                  `${insightJournalId}.pdf`
                );
                writeFileSync(cachedPdfPath, buffer);

                console.log(
                  `✓ Downloaded article.pdf to ${pdfPath} (${pdfBuffer.byteLength} bytes)`
                );
                console.log(`✓ Cached PDF to ${cachedPdfPath}`);
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
              `✗ No PDF file found in downloads for article ${insightJournalId}`
            );
          }

          // Fetch insight-journal-metadata.json and merge tags into keywords
          // (only if GitHub not already set from cache)
          if (!pageData.frontmatter?.github) {
            const metadataDownload = pageData.downloads.find(
              (download: any) =>
                download.title === "root/insight-journal-metadata.json"
            );

            if (metadataDownload && metadataDownload.url) {
              try {
                console.log(
                  `Fetching insight-journal-metadata.json for ${insightJournalId} from ${metadataDownload.url}`
                );

                const metadataResponse = await fetchWithRetry(
                  metadataDownload.url
                );

                if (metadataResponse.ok) {
                  const metadataJson = await metadataResponse.json();
                  console.log(
                    `✓ Fetched insight-journal-metadata.json for ${insightJournalId}`
                  );

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
          }

          // Download thumbnail to public/thumbnails/${insightJournalId}.jpg
          if (pageData.frontmatter?.thumbnail) {
            try {
              console.log(
                `Downloading thumbnail for ${insightJournalId} from ${pageData.frontmatter.thumbnail}`
              );

              const thumbnailResponse = await fetchWithRetry(
                pageData.frontmatter.thumbnail
              );

              if (thumbnailResponse.ok) {
                const thumbnailBuffer = await thumbnailResponse.arrayBuffer();
                const buffer = Buffer.from(thumbnailBuffer);

                // Write to public directory
                const thumbnailsDir = join(publicDir, "thumbnails");
                if (!existsSync(thumbnailsDir)) {
                  mkdirSync(thumbnailsDir, { recursive: true });
                }
                const thumbnailPath = join(
                  thumbnailsDir,
                  `${insightJournalId}.jpg`
                );
                writeFileSync(thumbnailPath, buffer);

                // Write to cache directory
                const cachedThumbnailsDir = join(cachePath, "thumbnails");
                if (!existsSync(cachedThumbnailsDir)) {
                  mkdirSync(cachedThumbnailsDir, { recursive: true });
                }
                const cachedThumbnailPath = join(
                  cachedThumbnailsDir,
                  `${insightJournalId}.jpg`
                );
                writeFileSync(cachedThumbnailPath, buffer);

                console.log(
                  `✓ Downloaded thumbnail to ${thumbnailPath} (${thumbnailBuffer.byteLength} bytes)`
                );
                console.log(`✓ Cached thumbnail to ${cachedThumbnailPath}`);
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
              const downloadsJson = JSON.stringify(
                pageData.downloads,
                null,
                2
              );

              // Write to public directory
              const downloadsDir = join(publicDir, "downloads");
              if (!existsSync(downloadsDir)) {
                mkdirSync(downloadsDir, { recursive: true });
              }
              const downloadsPath = join(
                downloadsDir,
                `${insightJournalId}.json`
              );
              writeFileSync(downloadsPath, downloadsJson, "utf-8");

              // Write to cache directory
              const cachedDownloadsDir = join(cachePath, "downloads");
              if (!existsSync(cachedDownloadsDir)) {
                mkdirSync(cachedDownloadsDir, { recursive: true });
              }
              const cachedDownloadsPath = join(
                cachedDownloadsDir,
                `${insightJournalId}.json`
              );
              writeFileSync(cachedDownloadsPath, downloadsJson, "utf-8");

              console.log(
                `✓ Saved downloads to ${downloadsPath} (${pageData.downloads.length} items)`
              );
              console.log(`✓ Cached downloads to ${cachedDownloadsPath}`);
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

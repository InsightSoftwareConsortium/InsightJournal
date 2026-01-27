#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 NumFOCUS, Inc.

/**
 * Prefetch Articles Script
 *
 * Downloads article data from dpid.org and caches it locally for robust builds.
 * Features:
 * - Exponential backoff with jitter
 * - Configurable retry attempts
 * - Detailed error logging with error codes
 * - Parallel fetching with concurrency limits
 * - Resume capability (skips already cached articles)
 * - Progress reporting
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // URLs
  //xrefUrl: 'https://insight-test.desci.com/myst.xref.json',
  xrefUrl: "https://insight-myst.desci1337.workers.dev/myst.xref.json",
  dpidBaseUrl: 'https://dev-beta.dpid.org',
  ipfsGateway: 'https://pub.desci.com/ipfs',

  // Cache paths
  cacheDir: resolve(process.cwd(), 'cache'),
  mystCacheDir: resolve(process.cwd(), 'cache/myst'),
  pdfsCacheDir: resolve(process.cwd(), 'cache/pdfs'),
  thumbnailsCacheDir: resolve(process.cwd(), 'cache/thumbnails'),
  downloadsCacheDir: resolve(process.cwd(), 'cache/downloads'),

  // Retry settings
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.3,

  // Concurrency
  concurrentFetches: 4,

  // Timeouts
  fetchTimeoutMs: 60000,

  // Options
  forceRefetch: process.argv.includes('--force'),
  skipAssets: process.argv.includes('--skip-assets'),
  verbose: process.argv.includes('--verbose'),
};

// ============================================================================
// Error Codes
// ============================================================================

const ErrorCode = {
  // Network errors (1xx)
  NETWORK_ERROR: 'E100',
  TIMEOUT: 'E101',
  DNS_ERROR: 'E102',
  CONNECTION_REFUSED: 'E103',
  CONNECTION_RESET: 'E104',

  // HTTP errors (2xx)
  HTTP_BAD_REQUEST: 'E200',
  HTTP_UNAUTHORIZED: 'E201',
  HTTP_FORBIDDEN: 'E202',
  HTTP_NOT_FOUND: 'E203',
  HTTP_RATE_LIMITED: 'E204',
  HTTP_SERVER_ERROR: 'E205',
  HTTP_BAD_GATEWAY: 'E206',
  HTTP_SERVICE_UNAVAILABLE: 'E207',
  HTTP_GATEWAY_TIMEOUT: 'E208',
  HTTP_UNKNOWN: 'E209',

  // Data errors (3xx)
  INVALID_JSON: 'E300',
  MISSING_FIELD: 'E301',
  INVALID_DATA: 'E302',

  // File system errors (4xx)
  FILE_WRITE_ERROR: 'E400',
  FILE_READ_ERROR: 'E401',
  DIRECTORY_ERROR: 'E402',

  // Unknown (9xx)
  UNKNOWN: 'E999',
};

// ============================================================================
// Logging
// ============================================================================

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = CONFIG.verbose ? LogLevel.DEBUG : LogLevel.INFO;

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, details = {}) {
  if (level > currentLogLevel) return;

  const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  const levelName = levelNames[level];
  const timestamp = formatTimestamp();

  const detailStr = Object.keys(details).length > 0
    ? ` ${JSON.stringify(details)}`
    : '';

  const prefix = level === LogLevel.ERROR ? '✗' :
                 level === LogLevel.WARN ? '⚠' :
                 level === LogLevel.INFO ? '→' : '·';

  console.log(`[${timestamp}] ${prefix} [${levelName}] ${message}${detailStr}`);
}

function logError(errorCode, message, details = {}) {
  log(LogLevel.ERROR, `[${errorCode}] ${message}`, details);
}

function logWarn(message, details = {}) {
  log(LogLevel.WARN, message, details);
}

function logInfo(message, details = {}) {
  log(LogLevel.INFO, message, details);
}

function logDebug(message, details = {}) {
  log(LogLevel.DEBUG, message, details);
}

// ============================================================================
// Error Classification
// ============================================================================

function classifyError(error, response = null) {
  // HTTP response errors
  if (response) {
    const status = response.status;
    switch (status) {
      case 400: return { code: ErrorCode.HTTP_BAD_REQUEST, message: 'Bad Request' };
      case 401: return { code: ErrorCode.HTTP_UNAUTHORIZED, message: 'Unauthorized' };
      case 403: return { code: ErrorCode.HTTP_FORBIDDEN, message: 'Forbidden' };
      case 404: return { code: ErrorCode.HTTP_NOT_FOUND, message: 'Not Found' };
      case 429: return { code: ErrorCode.HTTP_RATE_LIMITED, message: 'Rate Limited' };
      case 500: return { code: ErrorCode.HTTP_SERVER_ERROR, message: 'Internal Server Error' };
      case 502: return { code: ErrorCode.HTTP_BAD_GATEWAY, message: 'Bad Gateway' };
      case 503: return { code: ErrorCode.HTTP_SERVICE_UNAVAILABLE, message: 'Service Unavailable' };
      case 504: return { code: ErrorCode.HTTP_GATEWAY_TIMEOUT, message: 'Gateway Timeout' };
      default:
        if (status >= 400 && status < 500) {
          return { code: ErrorCode.HTTP_UNKNOWN, message: `Client Error ${status}` };
        }
        if (status >= 500) {
          return { code: ErrorCode.HTTP_SERVER_ERROR, message: `Server Error ${status}` };
        }
    }
  }

  // Network/fetch errors
  if (error) {
    const errorMessage = error.message || String(error);

    if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
      return { code: ErrorCode.TIMEOUT, message: 'Request timed out' };
    }
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      return { code: ErrorCode.DNS_ERROR, message: 'DNS lookup failed' };
    }
    if (errorMessage.includes('ECONNREFUSED')) {
      return { code: ErrorCode.CONNECTION_REFUSED, message: 'Connection refused' };
    }
    if (errorMessage.includes('ECONNRESET') || errorMessage.includes('socket hang up')) {
      return { code: ErrorCode.CONNECTION_RESET, message: 'Connection reset' };
    }
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return { code: ErrorCode.NETWORK_ERROR, message: 'Network error' };
    }
    if (error instanceof SyntaxError || errorMessage.includes('JSON')) {
      return { code: ErrorCode.INVALID_JSON, message: 'Invalid JSON response' };
    }
  }

  return { code: ErrorCode.UNKNOWN, message: error?.message || 'Unknown error' };
}

function isRetryable(errorCode) {
  const retryableCodes = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT,
    ErrorCode.DNS_ERROR,
    ErrorCode.CONNECTION_REFUSED,
    ErrorCode.CONNECTION_RESET,
    ErrorCode.HTTP_RATE_LIMITED,
    ErrorCode.HTTP_SERVER_ERROR,
    ErrorCode.HTTP_BAD_GATEWAY,
    ErrorCode.HTTP_SERVICE_UNAVAILABLE,
    ErrorCode.HTTP_GATEWAY_TIMEOUT,
  ];
  return retryableCodes.includes(errorCode);
}

// ============================================================================
// Exponential Backoff
// ============================================================================

function calculateBackoffDelay(attempt) {
  // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
  const exponentialDelay = CONFIG.initialDelayMs * Math.pow(CONFIG.backoffMultiplier, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, CONFIG.maxDelayMs);

  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * CONFIG.jitterFactor * (Math.random() - 0.5) * 2;

  return Math.round(cappedDelay + jitter);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Fetch with Retry
// ============================================================================

async function fetchWithRetry(url, options = {}) {
  let lastError = null;
  let lastErrorInfo = null;

  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.fetchTimeoutMs);

      logDebug(`Fetch attempt ${attempt + 1}/${CONFIG.maxRetries}`, { url });

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorInfo = classifyError(null, response);
        lastErrorInfo = errorInfo;

        if (!isRetryable(errorInfo.code)) {
          // Non-retryable HTTP error, fail immediately
          logError(errorInfo.code, `${errorInfo.message} (non-retryable)`, {
            url,
            status: response.status,
            statusText: response.statusText
          });
          throw new Error(`${errorInfo.code}: ${errorInfo.message}`);
        }

        // Retryable HTTP error
        logWarn(`${errorInfo.message}, will retry`, {
          url,
          status: response.status,
          attempt: attempt + 1,
          maxRetries: CONFIG.maxRetries
        });

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } else {
        // Success!
        return response;
      }
    } catch (error) {
      lastError = error;
      const errorInfo = classifyError(error);
      lastErrorInfo = errorInfo;

      if (!isRetryable(errorInfo.code)) {
        // Non-retryable error, fail immediately
        logError(errorInfo.code, `${errorInfo.message} (non-retryable)`, { url });
        throw error;
      }

      logWarn(`${errorInfo.message}, will retry`, {
        url,
        attempt: attempt + 1,
        maxRetries: CONFIG.maxRetries,
        error: error.message
      });
    }

    // Calculate backoff delay
    if (attempt < CONFIG.maxRetries - 1) {
      const delay = calculateBackoffDelay(attempt);
      logDebug(`Waiting ${delay}ms before retry`, { attempt: attempt + 1 });
      await sleep(delay);
    }
  }

  // All retries exhausted
  const finalErrorInfo = lastErrorInfo || { code: ErrorCode.UNKNOWN, message: 'Unknown error' };
  logError(finalErrorInfo.code, `All ${CONFIG.maxRetries} retries exhausted`, {
    url,
    lastError: lastError?.message
  });

  throw lastError || new Error(`Failed to fetch ${url} after ${CONFIG.maxRetries} attempts`);
}

// ============================================================================
// Directory Setup
// ============================================================================

function ensureDirectories() {
  const dirs = [
    CONFIG.cacheDir,
    CONFIG.mystCacheDir,
    CONFIG.pdfsCacheDir,
    CONFIG.thumbnailsCacheDir,
    CONFIG.downloadsCacheDir,
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      try {
        mkdirSync(dir, { recursive: true });
        logDebug(`Created directory: ${dir}`);
      } catch (error) {
        logError(ErrorCode.DIRECTORY_ERROR, `Failed to create directory`, { dir, error: error.message });
        throw error;
      }
    }
  }
}

// ============================================================================
// Article Fetching
// ============================================================================

async function fetchArticleList() {
  logInfo('Fetching article list from myst.xref.json');

  try {
    const response = await fetchWithRetry(CONFIG.xrefUrl);
    const xrefData = await response.json();

    if (!xrefData.references || !Array.isArray(xrefData.references)) {
      logError(ErrorCode.INVALID_DATA, 'Invalid myst.xref.json format: missing references array');
      throw new Error('Invalid myst.xref.json format');
    }

    const articleIds = [];
    for (const ref of xrefData.references) {
      if (ref.identifier && typeof ref.identifier === 'string') {
        const match = ref.identifier.match(/^dpid-(\d+)$/);
        if (match) {
          const articleId = parseInt(match[1], 10);
          if (!isNaN(articleId)) {
            articleIds.push(articleId);
          }
        }
      }
    }

    logInfo(`Found ${articleIds.length} articles in myst.xref.json`);

    // Save xref to cache
    const xrefCachePath = join(CONFIG.cacheDir, 'myst.xref.json');
    writeFileSync(xrefCachePath, JSON.stringify(xrefData, null, 2), 'utf-8');
    logDebug(`Saved myst.xref.json to cache`);

    return articleIds;
  } catch (error) {
    const errorInfo = classifyError(error);
    logError(errorInfo.code, `Failed to fetch article list`, { error: error.message });
    throw error;
  }
}

async function fetchArticle(articleId) {
  const url = `${CONFIG.dpidBaseUrl}/${articleId}?format=myst`;
  const cachePath = join(CONFIG.mystCacheDir, `${articleId}.json`);

  // Check cache (unless force refetch)
  if (!CONFIG.forceRefetch && existsSync(cachePath)) {
    logDebug(`Article ${articleId} already cached, skipping`);
    return { articleId, cached: true };
  }

  logInfo(`Fetching article ${articleId}`);

  try {
    const response = await fetchWithRetry(url);
    const pageData = await response.json();

    // Validate required fields
    const insightJournalId = pageData.frontmatter?.external_publication_id;
    if (!insightJournalId) {
      logError(ErrorCode.MISSING_FIELD, `Article ${articleId} missing external_publication_id`);
      return { articleId, error: 'Missing external_publication_id' };
    }

    // Save to cache
    writeFileSync(cachePath, JSON.stringify(pageData, null, 2), 'utf-8');
    logInfo(`✓ Cached article ${articleId} (IJ: ${insightJournalId})`);

    // Fetch assets if not skipped
    if (!CONFIG.skipAssets) {
      await fetchArticleAssets(articleId, insightJournalId, pageData);
    }

    return { articleId, insightJournalId, cached: false };
  } catch (error) {
    const errorInfo = classifyError(error);
    logError(errorInfo.code, `Failed to fetch article ${articleId}`, { error: error.message });
    return { articleId, error: error.message, errorCode: errorInfo.code };
  }
}

async function fetchArticleAssets(articleId, insightJournalId, pageData) {
  const downloads = pageData.downloads || [];

  // Find and download PDF
  let pdfDownload = downloads.find(d => d.title === 'root/article.pdf');
  if (!pdfDownload) {
    pdfDownload = downloads.find(d => d.title?.toLowerCase().endsWith('.pdf'));
  }

  if (pdfDownload?.url) {
    const pdfPath = join(CONFIG.pdfsCacheDir, `${insightJournalId}.pdf`);
    if (CONFIG.forceRefetch || !existsSync(pdfPath)) {
      try {
        logDebug(`Downloading PDF for ${insightJournalId}`);
        const response = await fetchWithRetry(pdfDownload.url);
        const buffer = await response.arrayBuffer();
        writeFileSync(pdfPath, Buffer.from(buffer));
        logDebug(`✓ Downloaded PDF (${buffer.byteLength} bytes)`);
      } catch (error) {
        logWarn(`Failed to download PDF for ${insightJournalId}`, { error: error.message });
      }
    }
  }

  // Download thumbnail
  if (pageData.frontmatter?.thumbnail) {
    const thumbnailPath = join(CONFIG.thumbnailsCacheDir, `${insightJournalId}.jpg`);
    if (CONFIG.forceRefetch || !existsSync(thumbnailPath)) {
      try {
        logDebug(`Downloading thumbnail for ${insightJournalId}`);
        const response = await fetchWithRetry(pageData.frontmatter.thumbnail);
        const buffer = await response.arrayBuffer();
        writeFileSync(thumbnailPath, Buffer.from(buffer));
        logDebug(`✓ Downloaded thumbnail (${buffer.byteLength} bytes)`);
      } catch (error) {
        logWarn(`Failed to download thumbnail for ${insightJournalId}`, { error: error.message });
      }
    }
  }

  // Save downloads list
  const downloadsPath = join(CONFIG.downloadsCacheDir, `${insightJournalId}.json`);
  if (CONFIG.forceRefetch || !existsSync(downloadsPath)) {
    writeFileSync(downloadsPath, JSON.stringify(downloads, null, 2), 'utf-8');
    logDebug(`✓ Saved downloads list (${downloads.length} items)`);
  }

  // Fetch insight-journal-metadata.json for GitHub URL
  const metadataDownload = downloads.find(d => d.title === 'root/insight-journal-metadata.json');
  if (metadataDownload?.url) {
    try {
      const response = await fetchWithRetry(metadataDownload.url);
      const metadata = await response.json();

      // Update pageData with GitHub URL if present
      if (metadata.source_code_git_repo?.includes('github.com')) {
        pageData.frontmatter = pageData.frontmatter || {};
        pageData.frontmatter.github = metadata.source_code_git_repo;

        // Re-save the updated pageData
        const cachePath = join(CONFIG.mystCacheDir, `${articleId}.json`);
        writeFileSync(cachePath, JSON.stringify(pageData, null, 2), 'utf-8');
        logDebug(`✓ Updated article with GitHub URL`);
      }
    } catch (error) {
      logWarn(`Failed to fetch metadata for ${insightJournalId}`, { error: error.message });
    }
  }
}

// ============================================================================
// Concurrency Control
// ============================================================================

async function processWithConcurrency(items, processor, concurrency) {
  const results = [];
  const inProgress = new Set();
  let index = 0;

  return new Promise((resolve, reject) => {
    const processNext = async () => {
      if (index >= items.length && inProgress.size === 0) {
        resolve(results);
        return;
      }

      while (inProgress.size < concurrency && index < items.length) {
        const currentIndex = index++;
        const item = items[currentIndex];

        const promise = processor(item)
          .then(result => {
            results[currentIndex] = result;
            inProgress.delete(promise);
            processNext();
          })
          .catch(error => {
            results[currentIndex] = { error: error.message };
            inProgress.delete(promise);
            processNext();
          });

        inProgress.add(promise);
      }
    };

    processNext();
  });
}

// ============================================================================
// Progress Reporting
// ============================================================================

function printProgress(completed, total, errors) {
  const percent = Math.round((completed / total) * 100);
  const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
  process.stdout.write(`\r[${bar}] ${percent}% (${completed}/${total}) Errors: ${errors}`);
}

function printSummary(results) {
  const successful = results.filter(r => !r.error).length;
  const cached = results.filter(r => r.cached).length;
  const failed = results.filter(r => r.error).length;

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                     PREFETCH SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total articles:    ${results.length}`);
  console.log(`  ✓ Successful:      ${successful}`);
  console.log(`  ⊘ Already cached:  ${cached}`);
  console.log(`  ✗ Failed:          ${failed}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\nFailed articles:');
    results
      .filter(r => r.error)
      .forEach(r => {
        console.log(`  - Article ${r.articleId}: [${r.errorCode || 'E999'}] ${r.error}`);
      });
  }

  return failed;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           INSIGHT JOURNAL ARTICLE PREFETCH                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (CONFIG.forceRefetch) {
    logInfo('Force refetch enabled - will re-download all articles');
  }
  if (CONFIG.skipAssets) {
    logInfo('Skip assets enabled - will only fetch article JSON');
  }

  const startTime = Date.now();

  try {
    // Setup directories
    ensureDirectories();

    // Fetch article list
    const articleIds = await fetchArticleList();

    if (articleIds.length === 0) {
      logError(ErrorCode.INVALID_DATA, 'No articles found to prefetch');
      process.exit(1);
    }

    logInfo(`Starting prefetch of ${articleIds.length} articles with concurrency ${CONFIG.concurrentFetches}`);
    console.log('');

    // Process articles with progress
    let completed = 0;
    let errors = 0;

    const results = await processWithConcurrency(
      articleIds,
      async (articleId) => {
        const result = await fetchArticle(articleId);
        completed++;
        if (result.error) errors++;
        printProgress(completed, articleIds.length, errors);
        return result;
      },
      CONFIG.concurrentFetches
    );

    // Print summary
    const failedCount = printSummary(results);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nCompleted in ${elapsed}s`);

    // Exit with error if any failures
    process.exit(failedCount > 0 ? 1 : 0);

  } catch (error) {
    logError(ErrorCode.UNKNOWN, 'Fatal error during prefetch', { error: error.message });
    console.error(error);
    process.exit(1);
  }
}

main();

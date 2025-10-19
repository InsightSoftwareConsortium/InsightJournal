// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 NumFOCUS, Inc. for the Insight Software Consortium

/**
 * Test script to download a few article PDFs from the Insight Journal website
 * Downloads PDFs from publication IDs 9 to 11 for testing
 */

import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - TEST VERSION WITH SMALL RANGE
const START_ID = 9;
const END_ID = 11; // Only download 3 PDFs for testing
const BASE_URL = "https://insight-journal.org/browse/publication";
const PDF_DIR = join(__dirname, "..", "archive", "pdfs");
const TIMEOUT = 60000; // 60 seconds timeout for navigation and downloads
const WAIT_AFTER_CLICK = 3000; // 3 seconds wait after clicking Article tab

/**
 * Ensure the PDF directory exists
 */
async function ensurePdfDirectory() {
  await mkdir(PDF_DIR, { recursive: true });
  console.log(`📁 PDF directory ready: ${PDF_DIR}`);
}

/**
 * Download a single PDF for a given publication ID
 */
async function downloadPdf(page, insightJournalId) {
  const url = `${BASE_URL}/${insightJournalId}`;
  const pdfPath = join(PDF_DIR, `${insightJournalId}.pdf`);

  try {
    console.log(`\n🔍 Processing publication ${insightJournalId}...`);

    // Navigate to the publication page
    console.log(`   Navigating to ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });

    // Wait for the page to be ready
    await page.waitForLoadState("networkidle", { timeout: TIMEOUT });

    // Click on the "Article" tab
    console.log(`   Clicking Article tab...`);
    const articleTab = page.getByRole("tab", { name: "Article" });

    // Check if Article tab exists
    const articleTabExists = (await articleTab.count()) > 0;
    if (!articleTabExists) {
      console.log(
        `   ⚠️  Article tab not found for publication ${insightJournalId}`
      );
      return {
        success: false,
        id: insightJournalId,
        error: "Article tab not found",
      };
    }

    await articleTab.click();

    // Wait for the Article content to load
    console.log(`   Waiting for content to load...`);
    await page.waitForTimeout(WAIT_AFTER_CLICK);

    // Try to wait for the Download PDF button
    try {
      await page.getByRole("button", { name: "Download PDF" }).waitFor({
        state: "visible",
        timeout: TIMEOUT,
      });
    } catch (err) {
      console.log(
        `   ⚠️  Download PDF button not found for publication ${insightJournalId}`
      );
      return {
        success: false,
        id: insightJournalId,
        error: "Download PDF button not found",
      };
    }

    // Start waiting for download before clicking
    console.log(`   Initiating PDF download...`);
    const downloadPromise = page.waitForEvent("download", { timeout: TIMEOUT });

    // Click the Download PDF button
    await page.getByRole("button", { name: "Download PDF" }).click();

    // Wait for the download to complete
    const download = await downloadPromise;

    // Save the downloaded file
    await download.saveAs(pdfPath);
    console.log(`   ✅ Downloaded: ${pdfPath}`);

    return { success: true, id: insightJournalId };
  } catch (error) {
    console.error(
      `   ❌ Error downloading publication ${insightJournalId}:`,
      error.message
    );
    return { success: false, id: insightJournalId, error: error.message };
  }
}

/**
 * Navigate to the next publication
 */
async function goToNextPublication(page) {
  try {
    // Find and click the "Next publication" button
    const nextButton = page.getByLabel("Next publication").getByRole("button");
    const nextButtonExists = (await nextButton.count()) > 0;

    if (!nextButtonExists) {
      console.log(`   ⚠️  Next publication button not found`);
      return false;
    }

    await nextButton.click();

    // Wait for navigation to complete
    await page.waitForLoadState("networkidle", { timeout: TIMEOUT });

    return true;
  } catch (error) {
    console.error(`   ❌ Error navigating to next publication:`, error.message);
    return false;
  }
}

/**
 * Main function to download all PDFs
 */
async function main() {
  console.log("🚀 Starting PDF download TEST...");
  console.log(`   Range: Publication ${START_ID} to ${END_ID} (TEST)`);

  // Ensure the PDF directory exists
  await ensurePdfDirectory();

  // Launch browser
  console.log("\n🌐 Launching browser...");
  const browser = await chromium.launch({
    headless: true,
    timeout: TIMEOUT,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
  });

  const page = await context.newPage();

  // Track results
  const results = {
    successful: [],
    failed: [],
    skipped: [],
  };

  // Start from the first publication
  let currentId = START_ID;

  try {
    while (currentId <= END_ID) {
      const result = await downloadPdf(page, currentId);

      if (result.success) {
        results.successful.push(result.id);
      } else {
        results.failed.push({ id: result.id, error: result.error });
      }

      // If we haven't reached the end, try to navigate to the next publication
      if (currentId < END_ID) {
        console.log(`   📄 Moving to next publication...`);
        const navigated = await goToNextPublication(page);

        if (!navigated) {
          console.log(
            `   ⚠️  Could not navigate to next publication. Moving to next ID manually...`
          );
          currentId++;
        } else {
          // Increment ID for next iteration
          currentId++;
        }

        // Small delay between downloads to be respectful to the server
        await page.waitForTimeout(1000);
      } else {
        break;
      }
    }
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DOWNLOAD SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("\n❌ Failed publications:");
    results.failed.forEach(({ id, error }) => {
      console.log(`   - Publication ${id}: ${error}`);
    });
  }

  console.log("\n✨ Test completed!");
}

// Run the script
main().catch(console.error);

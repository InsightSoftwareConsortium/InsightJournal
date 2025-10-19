// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Post-process fuse.json to update URLs and add frontmatter metadata
 */
async function postProcessFuse() {
  console.log('Starting fuse.json post-processing...');

  // Load fuse.json
  const fuseJsonPath = join(projectRoot, 'public', 'fuse.json');
  if (!existsSync(fuseJsonPath)) {
    console.error(`Error: ${fuseJsonPath} not found`);
    process.exit(1);
  }

  let fuseData;
  try {
    const fuseContent = readFileSync(fuseJsonPath, 'utf-8');
    fuseData = JSON.parse(fuseContent);
    console.log(`Loaded ${fuseData.length} entries from fuse.json`);
  } catch (error) {
    console.error(`Error reading fuse.json: ${error.message}`);
    process.exit(1);
  }

  // Process each entry
  let processedCount = 0;
  let updatedCount = 0;

  for (const entry of fuseData) {
    if (!entry.identifier || !entry.identifier.startsWith('dpid-')) {
      continue;
    }

    // Extract DPID
    const dpid = entry.identifier.replace('dpid-', '');
    const mystJsonPath = join(projectRoot, 'archive', 'myst', `${dpid}.json`);

    processedCount++;

    // Check if corresponding myst file exists
    if (!existsSync(mystJsonPath)) {
      // File doesn't exist - skip silently
      continue;
    }

    try {
      // Load the myst JSON file
      const mystContent = readFileSync(mystJsonPath, 'utf-8');
      const mystData = JSON.parse(mystContent);

      // Check if external_publication_id exists
      if (mystData.frontmatter?.external_publication_id) {
        const insightJournalId = mystData.frontmatter.external_publication_id;
        
        // Update URL
        entry.url = `/browse/publication/${insightJournalId}`;
        
        // Initialize frontmatter if it doesn't exist
        if (!entry.frontmatter) {
          entry.frontmatter = {};
        }

        // Add title if it exists in mystData (preserve existing or add new)
        if (mystData.frontmatter.title) {
          entry.frontmatter.title = mystData.frontmatter.title;
        }

        // Add keywords if available
        if (mystData.frontmatter.keywords) {
          entry.frontmatter.keywords = mystData.frontmatter.keywords;
        }

        // Add abstract if available
        if (mystData.frontmatter.abstract) {
          entry.frontmatter.abstract = mystData.frontmatter.abstract;
        }

        updatedCount++;
      }
    } catch (error) {
      console.warn(`Warning: Error processing ${mystJsonPath}: ${error.message}`);
    }
  }

  console.log(`Processed ${processedCount} entries, updated ${updatedCount} entries`);

  // Write updated data back to public/fuse.json
  try {
    writeFileSync(fuseJsonPath, JSON.stringify(fuseData), 'utf-8');
    console.log(`✓ Updated ${fuseJsonPath}`);
  } catch (error) {
    console.error(`Error writing to ${fuseJsonPath}: ${error.message}`);
    process.exit(1);
  }

  // Write to dist/fuse.json if dist directory exists
  const distFuseJsonPath = join(projectRoot, 'dist', 'fuse.json');
  const distDir = join(projectRoot, 'dist');
  
  if (existsSync(distDir)) {
    try {
      writeFileSync(distFuseJsonPath, JSON.stringify(fuseData), 'utf-8');
      console.log(`✓ Updated ${distFuseJsonPath}`);
    } catch (error) {
      console.error(`Error writing to ${distFuseJsonPath}: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`Note: dist directory does not exist, skipping dist/fuse.json`);
  }

  console.log('Fuse.json post-processing complete!');
}

// Run the post-processing
postProcessFuse().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

The Insight Journal
-------------------

The [Insight Journal](https://insight-journal.org/) is an Open Access on-line publication covering the domain of medical and scientific image processing and visualization.

The unique characteristics of the Insight Journal include:

- Open-access to articles, data, code, and reviews
- Open peer-review that invites discussion between reviewers and authors
- Support for continuous revision of articles, code, and reviews
- Sustainable, reproducible research via Web3 technologies and the principles of verifiability, decentralization, and incentive engineering

## Development

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
pnpm install
```

### Build Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server |
| `pnpm run build` | Build site (uses cache if available, network fallback) |
| `pnpm run build:full` | Prefetch all articles then build (recommended for production) |
| `pnpm run preview` | Preview production build |

### Prefetch System

The site uses a cache-first architecture for robust, offline-capable builds. Articles are prefetched from the DeSci network and cached locally.

```bash
# Prefetch all articles (skips already cached)
pnpm run prefetch

# Force re-fetch all articles
pnpm run prefetch:force

# Verbose output with detailed logging
pnpm run prefetch:verbose
```

**Cache location:** `./cache/`
- `cache/myst/` - Article JSON data
- `cache/pdfs/` - PDF files
- `cache/downloads/` - Download manifests
- `cache/thumbnails/` - Article thumbnails

The prefetch script includes:
- Exponential backoff with jitter (1s → 30s max)
- Up to 5 retries per request
- Detailed error codes (E100-E999) for debugging
- Concurrent fetching (4 parallel requests)

### Dependency Notes

The `pnpm.overrides` in `package.json` forces katex to v0.16.27 to fix an ESM compatibility issue with the older version bundled in myst-transforms.
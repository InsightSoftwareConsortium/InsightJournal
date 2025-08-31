# Agent Guidelines for Insight Journal

## Build Commands
- **Development server**: `astro dev`
- **Production build**: `astro build`
- **Preview build**: `astro preview`
- **Setup assets**: `node scripts/setup-assets.mjs`

## Code Style Guidelines

### Imports & Modules
- Use ES6 imports with named imports
- Group imports: external libraries first, then internal modules
- Use relative paths for internal imports

### Naming Conventions
- **Components**: PascalCase (e.g., `Layout.astro`, `NotFoundPage`)
- **Variables/Functions**: camelCase (e.g., `currentYear`, `setupDocsAssets`)
- **Files**: kebab-case for pages, camelCase for utilities

### TypeScript
- Use explicit type annotations for function parameters and return types
- Prefer interfaces over types for object shapes
- Use union types for multiple possible values

### Error Handling
- Use try/catch blocks for async operations
- Log errors with descriptive messages
- Exit with non-zero codes on critical failures

### Styling
- Use CSS custom properties for theming (`var(--sl-color-*)`)
- Support dark mode with `@media (prefers-color-scheme: dark)`
- Include responsive design with mobile-first media queries
- Use semantic class names and BEM methodology

### Documentation
- Include SPDX license headers for copyright
- Use JSDoc comments for public functions
- Add descriptive alt text for images
- Document configuration objects and their properties

### Best Practices
- No tests currently configured - add Jest/Vitest if needed
- No linting configured - consider adding ESLint + Prettier
- Follow Astro component patterns for consistency
- Use TypeScript strict mode for better type safety
---
"@notion-utils/cms": patch
"@notion-utils/md": patch
"@notion-utils/html": patch
---

Extract shared types to `@notion-utils/types` package

- Introduced `@notion-utils/types` package containing shared TypeScript definitions (`ContentBlockAdvanced`, `ContentBlockRaw`, `DatabaseRecord`, etc.)
- Re-exported types from the new shared package for backwards compatibility
- Updated internal imports across all packages to use the shared types
- This change is transparent to consumers - all existing exports remain available from their original packages


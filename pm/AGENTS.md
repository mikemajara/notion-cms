### **Project Purpose & Architecture**

This is **Notion CMS** – a TypeScript library that turns Notion databases into a headless CMS through a deliberate **3-layer API**:

1. **Simple API** – ergonomic JavaScript records/blocks backed by `convertRecordToSimple`, `convertBlocksToSimple`, and markdown/HTML renderers.
2. **Advanced API** – enriched metadata via `convertRecordToAdvanced`/`convertBlocksToAdvanced`, including captions, annotations, relations, media expiry, and optional custom media resolvers.
3. **Raw API** – direct Notion responses exposed through `convertRecord`, `DatabaseService.getRecordRaw`, and `PageContentService.getPageContentRaw` for full fidelity.

### **Technology Stack**

- **Language**: TypeScript (target ES2020)
- **Build Tool**: tsup (bundler for TypeScript)
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript parser
- **Package Manager**: pnpm (monorepo with Turborepo)
- **External Dependencies**:
  - `@notionhq/client` – Notion API client
  - `@aws-sdk/client-s3` (optional) – S3 storage support
  - `commander` – CLI tool
  - `ts-morph` – TypeScript AST manipulation for type generation

### **Core Architecture Components**

1. **NotionCMS (src/client.ts)** – composed entry class re-exported from `src/index.ts`; wires `DatabaseService`, `PageContentService`, `FileManager`, `registerDatabase`, and config merging.
2. **DatabaseService** – wraps Notion database queries, enriches record files, and backs the layered converters.
3. **QueryBuilder** – type-safe query DSL with metadata-aware filters, sorting, pagination, and `recordType` selection (`simple | advanced | raw`).
4. **PageContentService** – recursively fetches blocks, normalises media URLs, and hands off to block converters.
5. **ContentConverter & Block Converters** – provide markdown/HTML emitters plus advanced/simple block transformers.
6. **FileManager** – strategy-driven file handling (direct/local/remote) used by database and content services for cache-aware URLs.
7. **Type Generator (generator.ts)** – CLI foundation for per-database registries feeding `registerDatabase`.

### **Content & Record Pipeline**

- Records are fetched raw, then transformed through `record-processor.ts` helpers shared across services.
- Blocks flow through `PageContentService`, `convertBlocksToSimple` / `convertBlocksToAdvanced`, and optional `blocksToMarkdown` / `blocksToHtml` renderers.
- File URLs are stabilised centrally so every layer benefits from caching or remote storage when configured.

### **File Management Strategies**

- **Direct**: Returns Notion-hosted URLs untouched (default).
- **Local**: Caches assets under `files.storage.path` via `LocalStorage` and reuse-stable IDs.
- **Remote**: Streams files to S3-compatible backends with configurable endpoint/bucket/credentials.
- Strategy choice is controlled through `NotionCMSConfig.files.strategy`; caching state is observable via `FileManager.isCacheEnabled()`.

### **Configuration & Debugging**

- `mergeConfig` combines user config with defaults (direct strategy, local path, disabled logging).
- `debug.configure` gates scoped logging (`query`, `log`, `error`) supporting per-environment diagnostics.

### **Code Organization Patterns**

- Layered converters shared across Simple/Advanced/Raw APIs.
- Strategy pattern for storage backends and media resolution hooks.
- Service-oriented modules with explicit dependencies to avoid circular imports.
- Barrel exports limited to `src/index.ts` to keep consumer surface consistent with v0.2.0 changes.

### **Testing Standards**

- Integration tests expect real Notion credentials (see `src/tests`).
- Jest configuration lives in `packages/notion-cms/jest.config.js`.
- Focus areas: query builder behaviour, file caching, block conversion fidelity, and debug configuration.

### **Naming Conventions**

- **Classes**: PascalCase (e.g., `DatabaseService`, `PageContentService`).
- **Files**: kebab-case mirroring exported symbol (`database-service.ts`).
- **Types**: PascalCase with explicit suffixes (`DatabaseRecord`, `ContentBlockAdvanced`).
- **Generics**: Single letters or descriptive (`TRecord`, `DatabaseFieldMetadata`).

### **Important Implementation Details**

- Generated database registries must call `registerDatabase` so `NotionCMS.query()` resolves IDs and metadata.
- QueryBuilder guarantees operator/value compatibility using `DatabaseFieldMetadata` and `OPERATOR_MAP`.
- File enrichment occurs for page icons, covers, files properties, and media blocks before conversion.
- Markdown/HTML converters rely on `block-traversal` utilities for nested list grouping and depth-aware walking.
- Error handling surfaces original Notion API failures while logging structured context via `debug` helpers.

### **Recent Changes Reference (v0.2.0)**

- Moved the core `NotionCMS` implementation into `src/client.ts` with a streamlined public export barrel.
- Added first-class record and block conversion helpers for consumers with custom pipelines.
- Normalised block fetching to enrich media URLs before Simple/Advanced conversion layers.
- Documented the layered pipeline in `CHANGELOG.md` and ensured exports mirror the new structure.

### **Project Purpose & Architecture**

This is **Notion CMS** - a TypeScript library that transforms Notion databases into a powerful headless CMS with a unique **3-layer API architecture**:

1. **Simple API**: Clean JavaScript types for easy consumption
2. **Advanced API**: Rich metadata preserved from Notion
3. **Raw API**: Complete unmodified Notion responses

### **Technology Stack**

- **Language**: TypeScript (target ES2020)
- **Build Tool**: tsup (bundler for TypeScript)
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript parser
- **Package Manager**: pnpm (monorepo with Turborepo)
- **External Dependencies**:
  - `@notionhq/client` - Notion API client
  - `@aws-sdk/client-s3` (optional) - S3 storage support
  - `commander` - CLI tool
  - `ts-morph` - TypeScript AST manipulation for type generation

### **Core Architecture Components**

1. **NotionCMS** - Main entry class orchestrating all services
2. **DatabaseService** - Database operations and record retrieval  
3. **QueryBuilder** - Type-safe query construction with filters/sorting
4. **ContentProcessor** - Notion blocks to Markdown/HTML conversion
5. **FileManager** - Multi-strategy file handling (direct/local/S3)
6. **StorageInterface** - Unified storage abstraction for local/S3
7. **Type Generator** - CLI tool for generating types from Notion schemas

### **File Management Strategies**

- **Direct**: Links directly to Notion URLs (default)
- **Local**: Downloads and caches locally with TTL
- **Remote**: S3-compatible storage (AWS, Vercel Blob, DigitalOcean, MinIO, R2)

### **Code Organization Patterns**

- **Layered converters**: Separate converters for each API layer
- **Strategy pattern**: For file handling and storage
- **Service-oriented**: Each major feature is a service class
- **Type-safe builders**: QueryBuilder with full TypeScript inference

### **Testing Standards**

- Integration tests use real Notion API (requires credentials)
- Test files in `src/tests/` directory
- Phase-based organization matching development roadmap
- Tests cover query building, file management, sorting, and type system

### **Naming Conventions**

- **Classes**: PascalCase, descriptive (DatabaseService, QueryBuilder)
- **Files**: kebab-case matching class names
- **Types**: PascalCase with suffixes (DatabaseRecord, FilterCondition)
- **Interfaces**: Prefixed with 'I' when needed, or descriptive names
- **Generics**: Single letters (T, M) or descriptive (TRecord, TFields)

### **Important Implementation Details**

- Comments should be JSDoc format for public APIs only
- Error handling must preserve Notion API error details
- File operations use async/await consistently
- Dynamic imports for optional dependencies (AWS SDK)
- Configuration merges with defaults using deep merge
- Debug logging controlled by config levels

### **What AGENTS.md Should Include** (20-line version):

The current AGENTS.md file is indeed too brief. A more comprehensive version should include:

1. **Project context**: Notion CMS - TypeScript library for headless CMS
2. **Architecture summary**: 3-layer API (Simple/Advanced/Raw)
3. **Key libraries**: @notionhq/client, optional @aws-sdk/client-s3
4. **Build tools**: tsup, Jest, ESLint, pnpm monorepo
5. **Core components**: NotionCMS, DatabaseService, QueryBuilder, FileManager
6. **File strategies**: Direct/Local/Remote (S3-compatible)
7. **Testing approach**: Real Notion API for integration tests
8. **Type generation**: CLI tool for database schema types
9. **Error handling patterns**: Preserve Notion errors, graceful fallbacks
10. **Coding standards**: No comments unless requested, explicit types preferred

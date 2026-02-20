---
version: 1.0
supported_languages:
  - TypeScript
  - JavaScript
  - Markdown
  - YAML
agents:
  - name: implementer
    description: Builds and refactors features in packages and apps.
    instructions:
      - Follow pnpm workspace and Turborepo scripts.
      - Prefer minimal, focused changes with strong type safety.
      - Keep public APIs clear and consistent with layered Notion abstractions.
    tools:
      - pnpm
      - turbo
      - eslint
      - jest
  - name: reviewer
    description: Reviews behavior changes, regressions, and test quality.
    instructions:
      - Prioritize bugs, risk, and missing coverage over style-only feedback.
      - Check API shape, edge cases, and generated type expectations.
      - Confirm documentation changes when behavior changes.
  - name: docs-maintainer
    description: Keeps package and usage docs aligned with code.
    instructions:
      - Update docs in packages/notion-cms/docs when workflows change.
      - Keep examples runnable and aligned with generated Notion types.
constraints:
  - Use pnpm as the package manager.
  - Avoid destructive git operations unless explicitly requested.
  - Respect license and dependency constraints of upstream libraries.
---

# AGENTS Guide

This file provides context and operating guidelines for AI coding agents working in this repository. It is intended for tools like Cursor, Copilot, and other LLM-based contributors so they can make safe, useful, and project-aligned changes.

## Project Overview

`notion-cms` is a TypeScript-first monorepo for using Notion as a CMS with an ergonomic developer experience. The core package is `@notion-utils/cms`, supported by related packages for types and content rendering.

### Main goals

- Simplify Notion API usage for application developers.
- Preserve access to low-level Notion responses when needed.
- Provide generated types and query ergonomics that feel natural in TypeScript.

### Layered API model

- **Simple API**: ergonomic JS/TS values for common usage.
- **Advanced API**: richer structures with metadata preserved.
- **Raw API**: full Notion API fidelity.

Agents should preserve this layered model and avoid introducing APIs that blur boundaries between layers without explicit rationale.

## Tech Stack and Tooling

- **Monorepo**: pnpm workspaces (`apps/*`, `packages/*`)
- **Task runner**: Turborepo (`build`, `dev`, `lint`, `check-types`)
- **Language**: TypeScript (Node >= 18)
- **Build**: tsup (per package)
- **Lint**: ESLint
- **Tests**: Jest (at least in core package; other packages may vary)
- **Release/versioning**: Changesets + custom release script

Prefer existing scripts from `package.json` over ad hoc commands.

## Repository Structure

- `packages/notion-cms/`: core library (`NotionCMS`, query builder, record/block conversion, file strategy handling, CLI/generator)
- `packages/notion-types/`: shared type utilities and generated-facing type helpers
- `packages/notion-to-md/`: block-to-Markdown conversion
- `packages/notion-to-html/`: block-to-HTML conversion and tests
- `apps/documentation/`: docs site and examples
- `apps/*`: example or integration apps exercising the packages
- `.cursor/rules/`: project rules that must be followed by AI agents
- `pm/`: product/architecture notes and planning docs

When implementing features, prefer changes in `packages/*` first, then update example apps/docs as needed.

## Coding Standards

### Naming

Use a top-down naming convention where the generic term appears first.

- Preferred: `RecordProduction`, `RecordStaging`
- Avoid: `ProductionRecord`, `StagingRecord`

Apply this convention to new types, classes, and major symbols.

### Imports and modules

- Prefer explicit imports over inline type imports in export declarations.
- Keep imports readable and stable.
- Avoid unnecessary barrel expansion unless there is clear API value.

### Type safety and API behavior

- Preserve strict typing around query/filter/sort operations.
- Keep generated and runtime types aligned.
- Prefer explicit error handling with actionable messages.

### Testing expectations

- Add or update tests for behavioral changes.
- Prefer focused unit/integration tests near touched modules.
- For monorepo-wide confidence, run relevant workspace lint/typecheck/tests.

## Agent Instructions

### 1) Before coding

- Read nearby docs and existing patterns in the package being changed.
- Confirm whether a script already exists for the needed workflow.
- Avoid broad refactors unless the task explicitly asks for them.

### 2) During implementation

- Make smallest viable change first, then iterate.
- Preserve backwards behavior unless the task intentionally changes it.
- Keep comments concise and only where logic is non-obvious.
- Do not silently change generated-file contracts without documenting it.

### 3) Verification workflow

From repository root, use:

```bash
pnpm lint
pnpm check-types
pnpm build
```

For package-specific work, run targeted commands in that workspace where possible.

### 4) Documentation updates

When changing behavior in core flows (querying, generation, block conversion, file handling), update relevant docs in:

- `packages/notion-cms/docs/`
- package-level `README.md` files

## Security, Ethics, and Safety

- Do not commit secrets, tokens, credentials, or private keys.
- Respect third-party licenses and attributions.
- Avoid introducing telemetry, tracking, or network calls not required by the feature.
- Treat user content and Notion data carefully; avoid over-logging sensitive payloads.

## Collaboration and Commit Guidance

- Keep PRs/changes focused and easy to review.
- Explain why a change is needed, not only what changed.
- Use plain commit messages only (no trailers/signatures unless explicitly requested by maintainers).
- If behavior changes, include a short migration note in docs or changelog context.

## Persona Usage

- **implementer**: use for feature work, bug fixes, and refactors.
- **reviewer**: use for risk-focused review before merge.
- **docs-maintainer**: use when APIs, onboarding, or examples changed.

If a task spans coding + docs + review, sequence personas in that order.

## Example Agent Tasks

### Example: Query feature update

1. Update query builder logic in `packages/notion-cms/src/database/`.
2. Add tests for operator compatibility and edge cases.
3. Run package-level lint/typecheck/tests.
4. Update docs in `packages/notion-cms/docs/04-querying-data.md`.

### Example: New block conversion behavior

1. Implement in `packages/notion-to-md/` or `packages/notion-to-html/`.
2. Add fixtures/tests for nested and mixed block structures.
3. Validate output compatibility in docs/examples.

## Contributing with AI Effectively

- Provide concrete prompts: package path, desired behavior, constraints, and acceptance criteria.
- Ask for a plan first when the scope is unclear or architectural.
- Review AI output for API consistency, test depth, and docs alignment before merging.

## References

- Root `README.md`
- `packages/notion-cms/README.md`
- `packages/notion-cms/docs/`
- `.cursor/rules/`
- `.changeset/README.md`

Update this file as architecture, scripts, or release practices evolve.

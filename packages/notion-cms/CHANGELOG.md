# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

## [0.2.2] - 2025-10-03

### Fixed

- Button type throws an error on build.

## [0.2.1] - 2025-10-03

### Fixed

- Corrected `ContentProcessor` to use `getPageContent` after service refactor, restoring type-check compatibility for legacy API.

## [0.2.0] - 2025-10-02

### Changed

- Restructured public entry point by moving `NotionCMS` implementation into `src/client.ts` and re-exporting from `src/index.ts`.
- Clarified barrel exports to prepare for new layered API processors and consistent FileManager usage.
- Introduced standalone record conversion helpers (`convertRecordToSimple`, `convertRecordToAdvanced`, etc.) and updated docs to reflect the fetch-raw-then-convert workflow.
- Normalized block fetching to enrich media URLs via `PageContentService` and added block conversion helpers (`convertBlocksToSimple`, `convertBlocksToAdvanced`).
- Documented breaking API surface changes for the layered content conversion pipeline.

## [0.1.3] - 2025-09-24

### Changed

- Bump version to 0.1.3.
- Changes content api to 3 layers
- Changes methods to retrieve records adding a config object and centralizing fetching under one same signature
- Redefines blocksToMarkdown and blocksToHtml

### Notes

- Release preparation only; no runtime API changes.

<!-- Prior entries can be added here as needed. -->

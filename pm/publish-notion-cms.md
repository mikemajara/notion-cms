## Notion CMS – NPM Publishing Guide

This guide documents the end-to-end process for publishing the `@mikemajara/notion-cms` package to npm.

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- pnpm installed (project uses pnpm workspaces)
- npm account with publish access to the `@mikemajara` scope
- Logged in to npm on your machine:
  - `npm whoami` should show your username
  - If using 2FA, have your OTP ready

### Release Strategy
- Use semantic versioning.
  - Patch: bug fixes and internal refactors (e.g., 0.1.0 → 0.1.1)
  - Minor: backward-compatible features (0.1.x → 0.2.0)
  - Major: breaking changes (x.y.z → (x+1).0.0)
- For pre-releases: use `--preid=beta` and publish with `--tag beta`.

### Quick Checklist (TL;DR)
1) Working tree is clean and on the correct branch
2) Decide next version (patch/minor/major) and update `packages/notion-cms/package.json`
3) Validate locally (tests, types, build)
4) Inspect the publish tarball
5) Publish to npm
6) Verify on npm and in a consumer project

### Pre-publish Validation (run inside the package)
From the package directory:

```bash
cd packages/notion-cms

# 1) Run tests
pnpm run test

# 2) Type-check (no emit)
pnpm run check-types

# 3) Build production bundles (CJS, ESM, DTS)
pnpm run build:prod

# 4) (Optional) Lint
# Some test files may intentionally include unused types for demonstrations.
# If you enforce lint, ensure rules are set appropriately for a library.
pnpm run lint || true

# 5) Inspect the tarball contents without publishing
npm pack --dry-run
```

What to verify in `npm pack --dry-run`:
- `dist/` exists and includes `index.js`, `index.mjs`, and `index.d.ts`
- `package.json` has correct `name`, `version`, `main`, `module`, `types`, `exports`, `files`
- No unintended files included (respect `.npmignore`)

### Versioning
Decide the version bump and update `packages/notion-cms/package.json`:

```bash
# Patch example
git add -A && git commit -m "prep: publish 0.1.1"

# Option A: edit package.json version manually
# Option B: use npm version (runs a git tag by default)
npm version patch --no-git-tag-version
```

If you use `npm version` without `--no-git-tag-version`, it will create a git tag. Push tags after publish (see Post-publish).

### Publish
From `packages/notion-cms`:

```bash
# Confirm npm auth and registry
npm whoami
npm config get registry  # should be https://registry.npmjs.org/

# First-time for a new scoped package requires public access
# npm publish --access public

# Regular publish (package already public)
npm publish

# If you use 2FA and need to pass OTP explicitly
# npm publish --otp=123456

# Pre-release example
# npm version prerelease --preid=beta --no-git-tag-version
# npm publish --tag beta
```

### Post-publish Verification

```bash
# Verify latest version on npm
npm view @mikemajara/notion-cms version

# Optionally inspect all versions/tags
npm view @mikemajara/notion-cms versions --json | jq
npm dist-tag ls @mikemajara/notion-cms

# In a consumer project, update/install
pnpm add @mikemajara/notion-cms@latest
```

If you created a git tag (via `npm version`), push it:

```bash
git push && git push --tags
```

### Workspace Notes (this repo)
- The package lives at `packages/notion-cms`
- Project uses pnpm workspaces; run validation commands from the package directory
- Build is powered by `tsup` and generates CJS, ESM, and DTS into `dist/`
- The `.npmignore` controls publish-time file inclusion
- The public API avoids exposing internal wrappers; core methods are:
  - `query()` (primary entry via generated semantic keys)
  - `getRecord()`
  - `getPageContent()` (+ advanced/raw helpers)

### Troubleshooting
- 403/permissions: ensure you have publish rights to `@mikemajara`
- 2FA required: use `--otp=XXXXXX` with `npm publish`
- Wrong registry: `npm config get registry` should be `https://registry.npmjs.org/`
- Missing files in tarball: check `.npmignore` and `files` in `package.json`
- Build issues: re-run `pnpm run check-types` and `pnpm run build:prod`

### Optional Release Hygiene
- Update roadmap and docs when public API changes
- Add a CHANGELOG entry summarizing user-facing changes
- Create a GitHub release pointing to the tag

### One-command Validation (convenience)

```bash
cd packages/notion-cms \
  && pnpm run test \
  && pnpm run check-types \
  && pnpm run build:prod \
  && npm pack --dry-run
```



## Notion Utils – Publishing Guide

This guide explains how to release the `@notion-utils/*` packages with the new automation in place.

### Packages Covered
- `@notion-utils/cms`
- `@notion-utils/html`
- `@notion-utils/md`

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- pnpm installed (workspace uses pnpm)
- npm account with publish access to the `@notion-utils` scope
- Logged in locally: `npm whoami`
- 2FA token ready if your npm account requires it

### Release Overview
1. Create a changeset for every user-facing change.
2. Review the release plan.
3. Version the packages.
4. Publish to either the `beta` or `latest` dist-tag.
5. Verify the release and update docs if needed.

All release automation lives in `scripts/release.mjs`. The script reads the Changesets release plan so **only packages referenced in pending changesets are built and published**.

---

### 1. Create a Changeset

From the repo root:

```bash
pnpm changeset
```

- Choose the packages you are changing.
- Select the appropriate bump (patch/minor/major).
- Write a short summary (appears in changelog entries).

Repeat whenever you merge new work. Each `.changeset/*.md` file can cover one or multiple packages.

Check the current plan at any time:

```bash
pnpm exec changeset status
```

---

### 2. Run Validation Locally (per package)

From the package folder, run the typical checks. Example for `@notion-utils/cms`:

```bash
cd packages/notion-cms
pnpm run test
pnpm run check-types
pnpm run build:prod
```

Use equivalent commands for the Markdown and HTML packages.

---

### 3. Version Packages

Back in the repo root:

```bash
pnpm version-packages
```

This command:
- Calculates new versions from every pending changeset.
- Updates `package.json` files and changelogs.
- Refreshes the lockfile (`pnpm install --lockfile-only`).

Commit the generated files before publishing:

```bash
git add .
git commit -m "chore(release): version packages"
```

---

### 4. Publish

Use the scripted commands so only packages in the release plan are published.

#### Beta channel
```bash
pnpm release:beta
```
- Builds every package scheduled for release.
- Publishes using `changeset publish --tag beta`.
- npm consumers install via `@notion-utils/pkg@beta`.
- To limit the publish to one package:
  ```bash
  pnpm release:beta -- --package @notion-utils/md
  ```

#### Stable channel
```bash
pnpm release:latest
```
- Same build logic as beta.
- Publishes to npm’s default `latest` tag.
- Ideal to run from a stable release branch.

If you need to dry-run the plan, execute:

```bash
pnpm exec changeset status --output /tmp/release-plan.json
cat /tmp/release-plan.json
```

No publish occurs until you run the release commands.

---

### 5. Verify

After publishing:

```bash
npm dist-tag ls @notion-utils/cms
npm dist-tag ls @notion-utils/html
npm dist-tag ls @notion-utils/md

npm view @notion-utils/cms versions --json | jq '.[-5:]'
```

Optional: smoke-test in a sample project using the new tag.

---

### Branching Tips

- Keep `main` as the rolling beta branch.
- Cut release branches (e.g., `release/v1.2.x`) when promoting a beta to stable.
- Cherry-pick critical fixes from `main` into the release branch before running `pnpm release:latest`.

---

### Troubleshooting

- **403 forbidden:** ensure you have publish rights to the scope.
- **2FA prompts:** append `--otp=<code>` to the release command. Example:
  ```bash
  OTP=123456 pnpm release:latest
  ```
  (The script reads `process.env.OTP` automatically via npm CLI.)
- **Unexpected packages listed in the plan:** delete the changeset file you do not want to ship or split it into multiple files.
- **Need to retag:** use `npm dist-tag add @notion-utils/cms@1.2.3 latest` (replace package and version as needed).

---

### Manual Tarball Inspection (optional)

```bash
cd packages/notion-to-html
pnpm run build:prod
npm pack --dry-run
```

Check `package.json`, `dist/`, and that unwanted files are excluded.

---

### Summary

- Use Changesets for every change.
- `pnpm version-packages` to apply version bumps and changelogs.
- `pnpm release:beta` for pre-releases, `pnpm release:latest` for stable.
- Add `--package <name>` (repeatable) to target a single package when publishing.
- Release script only touches the packages referenced in the release plan.
- Verify npm dist-tags after each publish.

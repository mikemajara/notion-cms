## Release Checklist

Use this checklist when preparing a stable release for `@notion-utils/cms`.

### Pre-release

- [ ] Confirm `pnpm lint` and `pnpm test` succeed for `@notion-utils/cms`.
- [ ] Run `pnpm build --filter @notion-utils/cms` to ensure distributable artifacts emit cleanly.
- [ ] Review `CHANGELOG.md` and ensure the new version section summarizes user-facing changes.
- [ ] Verify `package.json` version aligns with the release tag.
- [ ] Double-check README and docs reference the correct package name (`@notion-utils/cms`) and reflect new features.

### Artifacts

- [ ] Inspect `dist/` output to confirm CLI entry points (`cli`, `generate`, `index`) exist for CJS/ESM/DTS.
- [ ] Ensure `files` array in `package.json` includes `dist` and excludes temporary assets.
- [ ] Run `pnpm pack --filter @notion-utils/cms` and inspect the generated tarball contents if needed.

### Publishing

- [ ] Authenticate with npm (`pnpm npm login`) using the project publisher account.
- [ ] Execute `pnpm publish --filter @notion-utils/cms --access public`.
- [ ] Tag the release in git (`git tag v1.0.0 && git push origin v1.0.0`).
- [ ] Draft release notes referencing the `CHANGELOG.md` entry.

### Post-release

- [ ] Upgrade internal apps in the monorepo to the new version via `pnpm update @notion-utils/cms`.
- [ ] Monitor npm download stats and open issues for regressions.
- [ ] Update documentation site deployment if required.


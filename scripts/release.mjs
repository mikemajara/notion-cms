#!/usr/bin/env node

import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const cwd = process.cwd();
const cliArgs = process.argv.slice(2);
let tag = 'latest';
const packageFilters = new Set();

for (let i = 0; i < cliArgs.length; i += 1) {
  const arg = cliArgs[i];

  if (!arg) continue;

  if (!arg.startsWith('-') && tag === 'latest') {
    tag = arg;
    continue;
  }

  if (arg === '--package' || arg === '--pkg' || arg === '-p') {
    const value = cliArgs[i + 1];
    if (!value || value.startsWith('-')) {
      console.error('A package name must follow the --package flag.');
      process.exit(1);
    }
    packageFilters.add(value);
    i += 1;
    continue;
  }
}

const releasePlanRelativePath = join('.changeset', 'release-plan.json');
const releasePlanPath = resolve(cwd, releasePlanRelativePath);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', cwd, ...options });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureReleasePlan() {
  run('pnpm', ['exec', 'changeset', 'status', '--output', releasePlanRelativePath]);

  if (!existsSync(releasePlanPath)) {
    console.error('Unable to generate release plan at', releasePlanPath);
    process.exit(1);
  }
}

function getPackagesToRelease() {
  const planRaw = readFileSync(releasePlanPath, 'utf8');
  const plan = JSON.parse(planRaw);

  return Array.isArray(plan.releases) ? plan.releases : [];
}

function buildPackages(packages) {
  packages.forEach(({ name }) => {
    console.log(`\n📦 Building ${name}`);
    run('pnpm', ['--filter', name, 'run', 'build']);
  });
}

function publish(tagValue) {
  const otp = process.env.OTP ?? process.env.NPM_CONFIG_OTP;
  const args = ['exec', 'changeset', 'publish'];

  if (tagValue && tagValue !== 'latest') {
    args.push('--tag', tagValue);
  }

  if (otp) {
    args.push('--otp', otp);
  }

  run('pnpm', args);
}

ensureReleasePlan();

const releases = getPackagesToRelease();

const filteredReleases = packageFilters.size
  ? releases.filter(({ name }) => packageFilters.has(name))
  : releases;

if (packageFilters.size && filteredReleases.length === 0) {
  console.error('No releases found for the requested package(s).');
  process.exit(1);
}

const missingPackages = [...packageFilters].filter(
  (name) => !releases.some((release) => release.name === name),
);

if (missingPackages.length) {
  console.error(
    'The following package(s) are not present in the release plan:',
    missingPackages.join(', '),
  );
  process.exit(1);
}

if (filteredReleases.length === 0) {
  console.log('No packages queued for release. Exiting.');
  if (existsSync(releasePlanPath)) {
    rmSync(releasePlanPath);
  }
  process.exit(0);
}

buildPackages(filteredReleases);
publish(tag);

if (existsSync(releasePlanPath)) {
  rmSync(releasePlanPath);
}

console.log(`\n✅ Release complete (${tag}).`);


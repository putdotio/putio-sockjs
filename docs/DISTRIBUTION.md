# Distribution

## Delivery Model

Every merge to `main` should already be releasable.

GitHub Actions ([ci.yml](../.github/workflows/ci.yml)) owns npm publishing and GitHub release notes. The pipeline runs the repo's Vite+ commands before publishing:

1. `vp install`
2. `vp run verify`
3. `vp run test:consumer`
4. `semantic-release`

The workflow uses `.releaserc.json` as the release source of truth.

The release job calls the [shared frontend release workflow](https://github.com/putdotio/.github/blob/main/frontend/README.md) from `putdotio/.github`, pinned to a tagged commit; the semantic-release action and plugin pins live there. [`scan.yml`](../.github/workflows/scan.yml) calls the shared frontend scan workflow from the same repository: Gitleaks, TruffleHog, Actionlint, and Zizmor on pull requests, weekly, and on manual dispatch.

## Release Environment

Release jobs declare the protected GitHub Environment named `release`.

Environment entries:

- secrets: `PUTIO_RELEASE_BOT_PRIVATE_KEY`
- variables: `PUTIO_RELEASE_BOT_CLIENT_ID`
- approval: none; releases are continuous after the `main` gate passes
- refs: release branch/tag policy constrains what can publish
- deployment records: disabled with `deployment: false` because this is package publishing, not an app deploy

Release GitHub writes use `putio-releaser` for version sync commits, `v*` tags, GitHub Releases, and release notes.

The npm package uses Trusted Publishing from GitHub Actions. On npm, configure owner `putdotio`, repository `putio-sockjs`, workflow `ci.yml`, and Environment named `release` for the package.

During the `@semantic-release/npm` publish step, npm detects the GitHub OIDC identity, mints short-lived publish credentials, and publishes provenance for the release job.

The workflow keeps dependency caches only on the secretless verify jobs. The secret-bearing release job runs a fresh `vp install` with package-manager caching disabled before publishing to npm.

The release bot token is minted only after dependencies are installed.

## Local Checks

Before changing distribution wiring, validate the repo-local guardrails the workflow depends on:

```bash
vp install
vp run verify
vp run test:consumer
```

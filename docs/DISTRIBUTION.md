# Distribution

## Delivery Model

Every merge to `main` should already be releasable.

GitHub Actions owns npm publishing and GitHub release notes. The pipeline runs the repo's Vite+ commands before publishing:

1. `vp install`
2. `vp run verify`
3. `semantic-release`

The workflow uses `.releaserc.json` as the release source of truth.

## Release Environment

Release jobs declare the protected GitHub Environment named `release`.

Environment entries:

- secrets: `PUTIO_RELEASE_BOT_PRIVATE_KEY`
- variables: `PUTIO_RELEASE_BOT_CLIENT_ID`
- approval: none; releases are continuous after the `main` gate passes
- refs: release branch/tag policy constrains what can publish
- deployment records: disabled with `deployment: false` because this is package publishing, not an app deploy

Release GitHub writes use `putio-release-bot` for version sync commits, `v*` tags, GitHub Releases, and release notes.

The npm package uses Trusted Publishing from GitHub Actions. On npm, configure owner `putdotio`, repository `putio-sockjs`, workflow `ci.yml`, and Environment named `release` for the package.

The workflow grants `id-token: write` so npm mints short-lived publish credentials and provenance for the release job.

The workflow keeps dependency caches only on the secretless verify job. The secret-bearing release job runs a fresh `vp install` with package-manager caching disabled before publishing to npm.

The release-bot remote is configured only after dependencies are installed.

## Local Checks

Before changing distribution wiring, validate the repo-local guardrails the workflow depends on:

```bash
vp install
vp run verify
```

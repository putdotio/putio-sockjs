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

- secrets: `NPM_TOKEN`, `PUTIO_RELEASE_BOT_PRIVATE_KEY`
- variables: `PUTIO_RELEASE_BOT_CLIENT_ID`
- approval: none; releases are continuous after the `main` gate passes
- refs: release branch/tag policy constrains what can publish
- deployment records: disabled with `deployment: false` because this is package publishing, not an app deploy

Release GitHub writes use `putio-release-bot` for version sync commits, `v*` tags, GitHub Releases, and release notes.

## Local Checks

Before changing distribution wiring, validate the repo-local guardrails the workflow depends on:

```bash
vp install
vp run verify
```

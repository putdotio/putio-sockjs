# Distribution

Every merge to `main` should be releasable. The `release` job in
[ci.yml](../.github/workflows/ci.yml) runs after `vp run verify` and
`vp run test:consumer` pass on a `main` push, and publishes to npm with
semantic-release. [`.releaserc.json`](../.releaserc.json) decides whether a
commit releases and how the version bumps.

The job calls `frontend-release-npm.yml` from the shared
[putdotio/.github workflows](https://github.com/putdotio/.github#frontend-release-npmyml),
pinned to a tagged commit. That workflow owns the semantic-release pins, the
release bot, and caching. [scan.yml](../.github/workflows/scan.yml) calls the
shared scan workflow from the same repository.

## Release Environment

The protected GitHub Environment `release` holds:

- secret `PUTIO_CI_APP_PRIVATE_KEY`
- variable `PUTIO_CI_APP_CLIENT_ID`

It has no approval step; releases are continuous once the `main` gate passes.
The `putio-ci` GitHub App writes the version-sync commit, `v*` tag, and
GitHub Release.

npm publishes through Trusted Publishing with provenance. The trusted
publisher on npm is owner `putdotio`, repository `putio-sockjs`, workflow `ci.yml`,
Environment `release`. Renaming `ci.yml` breaks publishing until npm is
updated.

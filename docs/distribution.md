# Distribution

A push to `main` publishes `@putdotio/socket-client` to npm through the
`release` job in [ci.yml](../.github/workflows/ci.yml), after `verify` and
`test:consumer` pass. The job calls the shared
[`frontend-release-npm.yml`](https://github.com/putdotio/.github#frontend-release-npmyml)
workflow, pinned to a reviewed commit SHA.

semantic-release reads [`.releaserc.json`](../.releaserc.json): `feat`, `fix`,
`perf`, reverts, and breaking changes publish; other types, such as `docs`,
`chore`, or `deps`, publish nothing.

## Release Environment

The protected GitHub Environment `release` supplies the secret
`PUTIO_CI_APP_PRIVATE_KEY` and the variable `PUTIO_CI_APP_CLIENT_ID`. It has
no approval step. The `putio-ci` GitHub App writes the version commit, the
`v*` tag, and the GitHub Release.

npm publishes through Trusted Publishing with provenance. The trusted
publisher is owner `putdotio`, repository `putio-sockjs`, workflow `ci.yml`,
Environment `release`. Renaming `ci.yml` breaks publishing until npm is
updated.

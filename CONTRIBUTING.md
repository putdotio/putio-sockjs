# Contributing

## Setup

```bash
vp install
vp config
```

`vp config` installs the Git hooks in `.vite-hooks/`.

## Validation

```bash
vp run verify
```

This is the pull request gate and the CI entrypoint: formatting, linting,
unused-code checks, package build, unit tests, and coverage.

## Publication Smoke

```bash
vp run test:consumer
```

Packs the package, installs the tarball into a temporary project, type-checks
the public API, checks runtime import, and confirms internal package paths
stay private. CI runs it on every pull request.

## Browser Lifecycle Smoke

```bash
vp exec playwright install chromium
vp run test:browser
```

Runs the packed package in Chromium against a deterministic SockJS protocol
fixture: authentication, explicit and terminal closure, bounded backoff,
cancellation, and reconnect event ordering. Playwright intercepts the network,
so no credentials or live endpoint are needed. The fixture supplies the
browser globals SockJS expects when its CommonJS dependencies are bundled.
CI does not run it.

## Live Handshake Smoke

```bash
vp run test:integration
```

Connects to the live put.io socket endpoint to exercise the real SockJS
handshake. It stays out of the default gate because it depends on an external
connection.

## Release

See [Distribution](./docs/DISTRIBUTION.md).

## Pull Requests

- Add or update tests when behavior changes.
- Update docs when package usage, validation, or release behavior changes.

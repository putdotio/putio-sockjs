# Contributing

## Setup

```bash
pnpm install
pnpm exec vp config
```

`pnpm exec vp config` installs the Git hooks in `.vite-hooks/`.

## Checks

```bash
pnpm exec vp run verify
pnpm exec vp run test:consumer
```

`verify` is the pull request gate. `test:consumer` installs the packed tarball
into a temporary project and checks the public API from outside the
workspace. CI runs both on every pull request.

## Browser Lifecycle Smoke

```bash
pnpm exec playwright install chromium
pnpm exec vp run test:browser
```

Runs the packed package in Chromium against a SockJS protocol fixture, with
the network intercepted, so it needs no credentials. Run it when connection
lifecycle, backoff, or reconnect ordering changes; CI does not run it.

## Live Handshake Smoke

```bash
pnpm exec vp run test:integration
```

Connects to the live put.io socket endpoint. It stays out of the default gate
because it depends on an external connection.

## Pull Requests

- Add or update tests when behavior changes.
- Update docs when package usage, checks, or release behavior changes.
- Release: [Distribution](./docs/distribution.md).

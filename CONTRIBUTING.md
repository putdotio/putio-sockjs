# Contributing

## Setup

```bash
pnpm install
pnpm exec vp config
```

## Checks

```bash
pnpm exec vp run verify
pnpm exec vp run test:consumer
```

## Browser Lifecycle Smoke

```bash
pnpm exec playwright install chromium
pnpm exec vp run test:browser
```

Run it when connection lifecycle, backoff, or reconnect ordering changes. CI
does not run it.

## Live Handshake Smoke

```bash
pnpm exec vp run test:integration
```

Connects to the live put.io socket endpoint, so the default gate skips it.

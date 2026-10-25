# Agent Guide

`@putdotio/socket-client` is the SockJS client for real-time put.io events.
put.io's web app installs it from npm.

- [README](./README.md): consumer usage and connection lifecycle.
- [Contributing](./CONTRIBUTING.md): setup, checks, and the opt-in smokes.

## Commands

[package.json](./package.json) `scripts` defines every command. Run Vite+
through the pinned devDependency: `pnpm exec vp`.

A fresh worktree needs no ignored local files:

```bash
pnpm install
pnpm exec vp config
pnpm exec vp run verify
```

## Rules

- `src/index.ts` and `src/types/*` are the public contract. Add internal-path
  imports only when the public API changes on purpose.
- Keep typed event names and payload maps aligned when socket event behavior
  changes.
- Default verification stays credential-free and offline; the live
  `test:integration` smoke stays opt-in. Prefer unit coverage of event parsing
  and reconnect behavior over new live checks.
- `README.md` is for consumers; contributor workflow goes in
  `CONTRIBUTING.md`.

## Proof

- Docs only: `pnpm exec vp check .`.
- Source change: `pnpm exec vp run verify`.
- Public API, exports, or packaging: also `pnpm exec vp run test:consumer`.
- Connection lifecycle, backoff, or reconnect ordering: also
  `pnpm exec vp run test:browser`. CI does not run it.
- Real SockJS handshake: `pnpm exec vp run test:integration`, against the live
  put.io socket endpoint.

## Delivery

Pull requests squash-merge to `main`; the `release` job in
[ci.yml](./.github/workflows/ci.yml) publishes `@putdotio/socket-client` to npm when
[`.releaserc.json`](./.releaserc.json) says the commits release.

- The squashed commit's type decides the version. npm never accepts a
  published version number again.
- npm Trusted Publishing names workflow `ci.yml` and Environment `release`.
  Renaming either breaks publishing until a maintainer updates the npm
  package settings.

# Agent Guide

`@putdotio/socket-client` is the SockJS client for real-time put.io events.
put.io's web app installs it from npm. Code lives in `src/`.

- [README](./README.md): consumer usage and connection lifecycle.
- [Contributing](./CONTRIBUTING.md): setup, checks, and the opt-in smokes.
- [Distribution](./docs/distribution.md): open before touching `ci.yml`,
  `.releaserc.json`, or the `release` Environment.

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

Pull requests squash-merge to `main`, and every merge can publish to npm. The
squashed commit's type decides the release (see
[Distribution](./docs/distribution.md)); npm never accepts a published version
number again.

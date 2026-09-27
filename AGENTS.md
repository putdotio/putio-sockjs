# Agent Guide

`@putdotio/socket-client` is a single-package TypeScript SockJS client for
real-time put.io events, built and packaged with Vite+. Code lives in `src/`.

## Start Here

- [Overview](./README.md): consumer usage and connection lifecycle
- [Contributing](./CONTRIBUTING.md): setup, validation, and the opt-in smokes
- [Distribution](./docs/DISTRIBUTION.md): npm release
- [Security](./SECURITY.md)

## Commands

The `scripts` block in [package.json](./package.json) defines every command.
Vite+ is the pinned `vite-plus` devDependency, so run it through
`pnpm exec vp`; no global install is needed. `pnpm exec vp run verify` is the
gate. The smokes are described in Contributing:
[`test:consumer`](./CONTRIBUTING.md#publication-smoke),
[`test:browser`](./CONTRIBUTING.md#browser-lifecycle-smoke), and
[`test:integration`](./CONTRIBUTING.md#live-handshake-smoke).

## Worktrees

`.worktreeinclude` lists no files; no ignored local files are needed. In a
fresh worktree run `pnpm install`, `pnpm exec vp config`, then
`pnpm exec vp run verify`.

## Rules

- `src/index.ts` and `src/types/*` are the public contract. Add internal-path
  imports only when the public API intentionally changes.
- Keep typed event names and payload maps aligned when socket event behavior
  changes.
- Default verification stays credential-free and offline; the live
  `test:integration` smoke stays opt-in. Prefer unit coverage of event parsing
  and reconnect behavior over new live checks.
- Keep `README.md` consumer-facing and contributor workflow in
  `CONTRIBUTING.md`.
- Update docs when package usage, install flow, or verification commands
  change.

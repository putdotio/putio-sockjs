# Agent Guide

## Repo

- Single-package TypeScript repo for `@putdotio/socket-client`
- SockJS client for real-time put.io events
- Main code lives in `src/*`

## Start Here

- [Overview](./README.md)
- [Contributing](./CONTRIBUTING.md): setup, `vp run verify`, the packed-consumer smoke, and the manual live handshake smoke
- [Distribution](./docs/DISTRIBUTION.md)
- [Security](./SECURITY.md)

## Commands

The `scripts` block in [package.json](./package.json) defines every command. The gate is
`vp run verify` (unit-only plus package build and coverage); `vp run test:consumer`
is the publication safety net and `vp run test:integration` is the manual live
SockJS smoke, both described in [Contributing](./CONTRIBUTING.md#publication-smoke).

## Worktrees

`.worktreeinclude` is tracked and lists no files by design; no ignored local
files are needed. In a fresh worktree run `vp install`, `vp config`, then
`vp run verify`.

## Repo-Specific Guidance

- Keep `README.md` consumer-facing. Put contributor workflow in `CONTRIBUTING.md` and keep `AGENTS.md` as the routing layer.
- Treat the root export surface in `src/index.ts` and `src/types/*` as the public contract. Add internal-path imports only when the public API intentionally changes.
- Keep typed event names and payload maps aligned when socket event behavior changes.
- Default verification stays credential-free and stable; live socket checks remain opt-in until the repo has a dedicated low-risk fixture strategy. Prefer targeted unit coverage around event parsing and reconnect behavior before expanding live checks.
- Update docs when package usage, install flow, or verification commands change.

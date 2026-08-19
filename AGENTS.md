# Agent Guide

## Repo

- Single-package TypeScript repo for `@putdotio/socket-client`
- SockJS client for real-time put.io events
- Main code lives in `src/*`

## Start Here

- [Overview](./README.md)
- [Contributing](./CONTRIBUTING.md)
- [Distribution](./docs/DISTRIBUTION.md)
- [Security](./SECURITY.md)

## Commands

- `vp install`
- `vp config`
- `vp check .`
- `vp pack`
- `vp run clean`
- `vp run test`
- `vp run coverage`
- `vp run test:consumer`
- `vp run test:integration`
- `vp run verify`

## Worktrees

`.worktreeinclude` declares which ignored local files managed worktrees carry
over. It is tracked and lists no files by design; a comment records that no
ignored local files are needed. In a fresh worktree run `vp install`,
`vp config`, then `vp run verify`.

## Repo-Specific Guidance

- Keep `README.md` consumer-facing. Put contributor workflow in `CONTRIBUTING.md` and keep `AGENTS.md` as the routing layer.
- Treat the root export surface in `src/index.ts` and `src/types/*` as the public contract. Add internal-path imports only when the public API intentionally changes.
- Keep typed event names and payload maps aligned when socket event behavior changes.
- Default verification should stay credential-free and stable. Live socket checks remain opt-in until the repo has a dedicated low-risk fixture strategy.
- Update docs when package usage, install flow, or verification commands change.

## Testing

- Default `vp run verify` is unit-only plus package build and coverage.
- `vp run test:consumer` is the publication safety net. It proves the packed tarball installs, type-checks, imports, and rejects internal package paths from a temp consumer project.
- `vp run test:integration` is a manual smoke for the live SockJS handshake path and should stay outside the default guardrail for now.
- Prefer targeted unit coverage around event parsing and reconnect behavior before expanding live checks.

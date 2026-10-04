# Agent Guide

`@putdotio/socket-client` is a single-package TypeScript SockJS client for
real-time put.io events, built and packaged with Vite+. put.io's web app
installs it from npm. Code lives in `src/`.

## Start Here

- [Overview](./README.md): consumer usage and connection lifecycle
- [Contributing](./CONTRIBUTING.md): setup, validation, and the opt-in smokes
- [Distribution](./docs/DISTRIBUTION.md): npm release
- [Security policy](https://github.com/putdotio/.github/blob/main/SECURITY.md)

## Commands

The `scripts` block in [package.json](./package.json) defines every command.
Vite+ is the pinned `vite-plus` devDependency, so run it through
`pnpm exec vp`; no global install is needed.

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

## Proof

- Docs only: `pnpm exec vp check .`; no runtime proof.
- Source change: `pnpm exec vp run verify`.
- Public API, exports, or packaging: also `pnpm exec vp run test:consumer`,
  the [publication smoke](./CONTRIBUTING.md#publication-smoke). CI runs it on
  every pull request.
- Connection lifecycle, backoff, or reconnect ordering:
  `pnpm exec vp run test:browser`, the
  [browser lifecycle smoke](./CONTRIBUTING.md#browser-lifecycle-smoke). CI
  does not run it.
- Real SockJS handshake: `pnpm exec vp run test:integration`, the
  [live handshake smoke](./CONTRIBUTING.md#live-handshake-smoke) against the
  live put.io socket endpoint.

## Delivery

Pull requests squash-merge to `main`. A push to `main` runs `verify` and
`test:consumer`, then semantic-release publishes `@putdotio/socket-client` to
npm when the commits since the last release include `feat`, `fix`, `perf`, or
a breaking change; `docs`, `chore`, `test`, and `ci` publish nothing. The
squashed commit's type is the version decision, and npm never accepts a
published version number again.

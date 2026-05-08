# Contributing

Thanks for contributing to `@putdotio/socket-client`.

## Setup

Install dependencies with Vite+ and wire the stock Git hooks:

```bash
vp install
vp config
```

## Validation

Run the repo guardrail before opening or updating a pull request:

```bash
vp run verify
```

That command runs type checks, package build, unit tests, and coverage using the same entrypoint CI relies on.

## Optional Smoke Test

The repo keeps a websocket smoke test outside the default guardrail because it depends on a live external connection.

Run it manually when you want extra confidence in the real SockJS handshake path:

```bash
vp run test:integration
```

## Release Publishing

GitHub Actions publishes from `main` through the protected `release` Environment.

Keep `NPM_TOKEN`, `PUTIO_RELEASE_BOT_APP_ID`, and `PUTIO_RELEASE_BOT_PRIVATE_KEY` in that Environment with required reviewers and prevent self-review enabled, not as plain repository secrets. Pull request checks stay secretless and only run verify jobs.

Release GitHub writes use `putio-release-bot` for version sync commits, `v*` tags, GitHub Releases, and npm release notes. Trusted put.io team members may push directly to `main`, but repository rules should block outsiders, force-pushes, and branch deletes where GitHub plan support allows.

## Development Notes

- Prefer `vp` for day-to-day commands.
- Put end-user package usage in [Overview](./README.md).
- Keep contributor workflow changes in this file and security reporting guidance in [Security](./SECURITY.md).

## Pull Requests

- Keep changes focused.
- Add or update tests when behavior changes.
- Update docs when package usage, validation, or release behavior changes.

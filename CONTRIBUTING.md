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

## Development Notes

- Prefer `vp` for day-to-day commands.
- Put end-user package usage in [README.md](./README.md).
- Keep contributor workflow changes in this file and security reporting guidance in [SECURITY.md](./SECURITY.md).
- Release commits created by the semantic-release workflow are authored and committed as `devsputio <devs@put.io>`.

## Pull Requests

- Keep changes focused.
- Add or update tests when behavior changes.
- Update docs when package usage, validation, or release behavior changes.

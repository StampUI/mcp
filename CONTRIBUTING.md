# Contributing to @stampui/mcp

This repo is the source of truth for the `@stampui/mcp` npm package. It is a small, single-purpose MCP server; contributions that keep it small are the best kind.

## Setup

```bash
git clone https://github.com/StampUI/mcp
cd mcp
npm install
npm run build
npx @modelcontextprotocol/inspector node dist/index.js   # interactive testing
```

## Ground rules

- MIT surface only: no pro/commercial block source, no registry secrets, no license keys in code, fixtures, or tests.
- PRs that add ways to bypass the license check for pro blocks will be closed.
- New tools or parameters: open an issue first describing the agent workflow they enable.
- `npm run typecheck` and `npm run build` must pass (CI enforces this).
- Update README and CHANGELOG when behavior changes.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). By contributing you agree your contributions are MIT licensed.

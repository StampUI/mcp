# @stampui/mcp

[![npm](https://img.shields.io/npm/v/%40stampui%2Fmcp?color=000)](https://www.npmjs.com/package/@stampui/mcp)
[![CI](https://github.com/StampUI/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/StampUI/mcp/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/StampUI/mcp?color=000)](./LICENSE)

MCP (Model Context Protocol) server for [StampUI](https://stampui.com). Lets an AI coding agent browse the StampUI block registry and stamp blocks into a project as real `.tsx` source files, without leaving the editor: "add an FAQ section" becomes search, inspect, install.

## Tools

| Tool | What it does |
|------|--------------|
| `list_blocks` | List blocks, filter by `category`, `tier` (`free`/`pro`), or `framework` |
| `search_blocks` | Free-text search across slug, title, description, tags |
| `get_block` | Full manifest, install command, docs link, and source (free blocks) or an unlock note (pro blocks) |
| `stamp_block` | Write a block's files into the project at an absolute `targetDir` |

The registry data and free block sources come from the MIT [`@stampui/blocks`](https://www.npmjs.com/package/@stampui/blocks) package; the manifest format is documented in the open [block manifest spec](https://github.com/StampUI/ui/blob/main/docs/block-manifest.md).

## Setup

### Claude Code

```bash
claude mcp add stampui -- npx -y @stampui/mcp
```

### Claude Desktop

Add to `claude_desktop_config.json` (Settings > Developer > Edit Config):

```json
{
  "mcpServers": {
    "stampui": {
      "command": "npx",
      "args": ["-y", "@stampui/mcp"]
    }
  }
}
```

### Cursor and other MCP clients

Add the same entry to the client's MCP config (e.g. `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "stampui": {
      "command": "npx",
      "args": ["-y", "@stampui/mcp"]
    }
  }
}
```

## Free vs pro

Everything needed for **free blocks works offline and without an account**: sources ship inside `@stampui/blocks`.

**Pro blocks** are part of the commercial StampUI catalog. Their source is not in this package or any public repo. With a license key, set it in the server's environment and pro sources are fetched from the licensed registry per request:

```bash
claude mcp add stampui --env STAMPUI_TOKEN=SU_LIVE_-XXXX -- npx -y @stampui/mcp
```

Without a token, pro blocks still appear in listings and `get_block` explains how to unlock them; the server never attempts to bypass licensing, and PRs adding such behavior will be closed.

## Environment variables

| Variable | Meaning | Default |
|----------|---------|---------|
| `STAMPUI_TOKEN` | Commercial license key; only needed for pro blocks | unset |
| `STAMPUI_REGISTRY_URL` | Registry origin, useful for testing | `https://stampui.com` |

## Security notes

- The server runs locally over stdio; it makes network requests only for pro block fetches, over HTTPS to the registry.
- `stamp_block` writes files. It requires an absolute `targetDir` and refuses paths that resolve outside it. Review what your agent installs like any other code it writes; MCP clients ask for permission before tool calls by default, keep that on for `stamp_block`.
- Your license key is read from the environment and sent only in the `Authorization` header to the registry. Never paste it into chat.
- Report vulnerabilities per [SECURITY.md](./SECURITY.md).

## Development

```bash
git clone https://github.com/StampUI/mcp
cd mcp
npm install
npm run build
# exercise it with the MCP inspector:
npx @modelcontextprotocol/inspector node dist/index.js
```

## Links

- StampUI: https://stampui.com
- Free component source: https://github.com/StampUI/ui
- CLI: https://github.com/StampUI/cli
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## License

MIT for this server. Free blocks it delivers are MIT via `@stampui/blocks`; pro blocks are covered by the [StampUI commercial license](https://stampui.com/docs/license).

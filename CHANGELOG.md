# Changelog

## 0.1.1 (2026-07-08)

- **First working npm publish.** The `0.1.0` tarball shipped without `dist/`, so `npx -y @stampui/mcp` failed; a `prepublishOnly` build step now guarantees the compiled server is present.
- Source published at https://github.com/StampUI/mcp (this repo is now the source of truth for the package)
- `stamp_block` refuses file paths that resolve outside `targetDir`

## 0.1.0 (2026-06-14)

- Initial release: `list_blocks`, `search_blocks`, `get_block`, `stamp_block` over stdio; free blocks served from `@stampui/blocks`, pro blocks from the licensed registry with `STAMPUI_TOKEN`

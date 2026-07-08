# Changelog

## Unreleased

- Source published at https://github.com/StampUI/mcp (this repo is now the source of truth for the package)
- `stamp_block` refuses file paths that resolve outside `targetDir`
- `prepublishOnly` build step, so the published package always contains `dist/`
- Known issue being fixed by the above: the `0.1.0` tarball on npm was published without `dist/`, so `npx -y @stampui/mcp` fails; `0.1.1` will be the first working publish

## 0.1.0 (2026-06-14)

- Initial release: `list_blocks`, `search_blocks`, `get_block`, `stamp_block` over stdio; free blocks served from `@stampui/blocks`, pro blocks from the licensed registry with `STAMPUI_TOKEN`

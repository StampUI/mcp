# Changelog

## Unreleased

- `stamp_block` checks every file path before writing anything: only relative `components/` and `lib/` paths are accepted, so a bad manifest entry never leaves a half-written block.
- `stamp_block` requires `targetDir` to contain a `package.json` (the project root), so an agent cannot be steered into writing into an arbitrary folder.
- Unknown slugs such as `__proto__` are rejected instead of resolving to object internals.
- Stdio smoke test in CI.

## 0.1.1 (2026-07-08)

- **First working npm publish.** The `0.1.0` tarball shipped without `dist/`, so `npx -y @stampui/mcp` failed; a `prepublishOnly` build step now guarantees the compiled server is present.
- Source published at https://github.com/StampUI/mcp (this repo is now the source of truth for the package)
- `stamp_block` refuses file paths that resolve outside `targetDir`

## 0.1.0 (2026-06-14)

- Initial release: `list_blocks`, `search_blocks`, `get_block`, `stamp_block` over stdio; free blocks served from `@stampui/blocks`, pro blocks from the licensed registry with `STAMPUI_TOKEN`

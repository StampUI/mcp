#!/usr/bin/env node
/**
 * StampUI MCP server.
 *
 * Lets an agent (Cursor, Claude Code, ...) browse the StampUI registry and
 * stamp blocks into the user's project without leaving the editor. This is the
 * vibecoder entry point: "add a billing page" -> agent finds + installs it.
 *
 * Tools:
 *   list_blocks      filter by category / tier / framework
 *   search_blocks    free-text over slug, title, description, tags
 *   get_block        manifest + install command + (free) source, (pro) how to unlock
 *   stamp_block      write a block's files into a target directory
 *
 * Free block sources ship in @stampui/blocks. Pro blocks require a license:
 * set STAMPUI_TOKEN (su_live_...) and the server fetches them from the licensed
 * registry, exactly like the CLI.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { blockList, manifests, type BlockManifest } from "@stampui/blocks"

const require = createRequire(import.meta.url)
const REGISTRY_URL = process.env.STAMPUI_REGISTRY_URL || "https://stampui.com"
const TOKEN = process.env.STAMPUI_TOKEN

function isPro(b: BlockManifest): boolean {
  return b.status === "pro" || b.status === "locked"
}

function summarize(b: BlockManifest) {
  return {
    slug: b.slug,
    title: b.title,
    description: b.description,
    category: b.category,
    tier: isPro(b) ? "pro" : "free",
    tags: b.tags,
    dependencies: b.dependencies,
  }
}

function packageDir(): string {
  return path.dirname(require.resolve("@stampui/blocks/package.json"))
}

/** Returns the files for a block: free from the npm package, pro from the registry. */
async function resolveFiles(
  b: BlockManifest
): Promise<{ files: { path: string; content: string }[] } | { error: string }> {
  if (!isPro(b)) {
    const dir = packageDir()
    const files = []
    for (const f of b.files) {
      const p = path.join(dir, "src", f.path)
      if (fs.existsSync(p)) files.push({ path: f.path, content: fs.readFileSync(p, "utf-8") })
    }
    if (files.length === 0) return { error: "Source files not found. Try updating @stampui/blocks." }
    return { files }
  }

  if (!TOKEN) {
    return {
      error: `${b.slug} is a Pro block. Set STAMPUI_TOKEN (su_live_...) in the MCP server env to unlock it. Get a license at ${REGISTRY_URL}/pricing`,
    }
  }
  let res: Response
  try {
    res = await fetch(`${REGISTRY_URL}/api/registry/${b.slug}`, {
      headers: { authorization: `Bearer ${TOKEN}` },
    })
  } catch {
    return { error: `Could not reach the StampUI registry at ${REGISTRY_URL}.` }
  }
  if (res.status === 401) return { error: "Invalid or expired license key (STAMPUI_TOKEN)." }
  if (!res.ok) return { error: `Registry returned ${res.status}.` }
  const data = (await res.json()) as { files?: { path: string; content: string }[] }
  if (!data.files?.length) return { error: "Registry response was empty." }
  return { files: data.files }
}

const TOOLS = [
  {
    name: "list_blocks",
    description:
      "List StampUI blocks. Optionally filter by category, tier (free|pro) or framework. Returns slug, title, description, tier and tags for each.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "e.g. UI, Dashboard, Auth, AI, Finance" },
        tier: { type: "string", enum: ["free", "pro"] },
        framework: { type: "string", description: "e.g. nextjs, react, vite" },
      },
    },
  },
  {
    name: "search_blocks",
    description:
      "Search StampUI blocks by free text across slug, title, description and tags. Use this to find a block for a need, e.g. 'billing', 'data table', 'login'.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "get_block",
    description:
      "Get full details for one block: manifest, install command, dependencies, and the source code (free blocks) or how to unlock it (pro blocks).",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "stamp_block",
    description:
      "Write a block's source files into the user's project. Provide the slug and a target directory (absolute, e.g. the repo root). Free blocks work offline; pro blocks need STAMPUI_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        targetDir: { type: "string", description: "Absolute path of the project root to write files into." },
      },
      required: ["slug", "targetDir"],
    },
  },
]

const server = new Server(
  { name: "stampui", version: "0.1.1" },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

function text(value: unknown) {
  return {
    content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
  }
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params

  if (name === "list_blocks") {
    let list = blockList
    const a = args as { category?: string; tier?: string; framework?: string }
    if (a.category) list = list.filter((b) => b.category.toLowerCase() === a.category!.toLowerCase())
    if (a.tier) list = list.filter((b) => (isPro(b) ? "pro" : "free") === a.tier)
    if (a.framework) list = list.filter((b) => b.frameworks.includes(a.framework!))
    return text({ count: list.length, blocks: list.map(summarize) })
  }

  if (name === "search_blocks") {
    const q = String((args as { query?: string }).query ?? "").toLowerCase()
    const results = blockList.filter(
      (b) =>
        b.slug.includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q)) ||
        b.category.toLowerCase().includes(q)
    )
    return text({ count: results.length, blocks: results.map(summarize) })
  }

  if (name === "get_block") {
    const slug = String((args as { slug?: string }).slug ?? "")
    const b = manifests[slug]
    if (!b) return text(`Block '${slug}' not found. Use search_blocks to find one.`)
    const resolved = await resolveFiles(b)
    return text({
      ...summarize(b),
      installCommand: `npx stampui add ${b.slug}`,
      docs: `${REGISTRY_URL}/blocks/${b.category === "UI" ? "components" : "piece"}/${b.slug}`,
      ...("error" in resolved ? { locked: true, note: resolved.error } : { files: resolved.files }),
    })
  }

  if (name === "stamp_block") {
    const { slug, targetDir } = args as { slug?: string; targetDir?: string }
    const b = slug && Object.hasOwn(manifests, slug) ? manifests[slug] : undefined
    if (!b) return text(`Block '${slug}' not found.`)
    if (!targetDir || !path.isAbsolute(targetDir)) return text("targetDir must be an absolute path.")
    const root = path.resolve(targetDir)
    if (!fs.existsSync(path.join(root, "package.json"))) {
      return text(`No package.json in ${root}. targetDir must be the root of the project to stamp into.`)
    }
    const resolved = await resolveFiles(b)
    if ("error" in resolved) return text(resolved.error)
    // File paths come from the registry manifest: validate every one before
    // writing anything, so a bad path never leaves a half-written block.
    const planned: { dest: string; path: string; content: string }[] = []
    for (const f of resolved.files) {
      const dest = path.resolve(root, f.path)
      const safe =
        typeof f.path === "string" &&
        /^(components|lib)\/[A-Za-z0-9._\/-]+$/.test(f.path) &&
        f.path.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..") &&
        dest.startsWith(root + path.sep)
      if (!safe) return text(`Refusing to stamp ${b.slug}: unsafe file path ${JSON.stringify(f.path)}. Nothing was written.`)
      planned.push({ dest, path: f.path, content: f.content })
    }
    const written: string[] = []
    for (const f of planned) {
      const dest = f.dest
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, f.content)
      written.push(f.path)
    }
    return text({
      stamped: b.slug,
      written,
      dependencies: b.dependencies,
      next: b.dependencies.length ? `Install deps: npm i ${b.dependencies.join(" ")}` : "No extra dependencies.",
    })
  }

  return text(`Unknown tool: ${name}`)
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr so it does not corrupt the stdio protocol on stdout
  console.error("StampUI MCP server running on stdio")
}

main().catch((e) => {
  console.error("StampUI MCP fatal:", e)
  process.exit(1)
})

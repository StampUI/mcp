// Stdio protocol smoke test: spawns the built server, runs the MCP
// initialize handshake, lists tools and calls search_blocks. Free tier only,
// no network and no STAMPUI_TOKEN.
import { spawn } from "node:child_process"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"

const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url))
const env = { ...process.env }
delete env.STAMPUI_TOKEN
const server = spawn(process.execPath, [entry], { stdio: ["pipe", "pipe", "inherit"], env })

const pending = new Map()
let buffer = ""
server.stdout.on("data", (chunk) => {
  buffer += chunk
  let newline
  while ((newline = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, newline).trim()
    buffer = buffer.slice(newline + 1)
    if (!line) continue
    const message = JSON.parse(line)
    pending.get(message.id)?.(message)
    pending.delete(message.id)
  }
})

let nextId = 1
function request(method, params) {
  const id = nextId++
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${method}: no response in 10s`)), 10_000)
    pending.set(id, (message) => {
      clearTimeout(timer)
      if (message.error) reject(new Error(`${method}: ${message.error.message}`))
      else resolve(message.result)
    })
  })
}

try {
  const init = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "stampui-smoke", version: "0.0.0" },
  })
  assert.equal(init.serverInfo.name, "stampui")
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n")

  const { tools } = await request("tools/list", {})
  const names = tools.map((t) => t.name).sort()
  assert.deepEqual(names, ["get_block", "list_blocks", "search_blocks", "stamp_block"])

  const search = await request("tools/call", { name: "search_blocks", arguments: { query: "button" } })
  assert.ok(Array.isArray(search.content) && search.content.length > 0, "search_blocks returned no content")
  assert.equal(search.content[0].type, "text")
  assert.ok(search.content[0].text.length > 0, "search_blocks returned empty text")

  console.log(`smoke: ok (${names.length} tools, search_blocks answered)`)
} finally {
  server.kill()
}

#!/usr/bin/env node
import { createInterface } from "readline"
import { writeFileSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const CONFIG_PATH = join(homedir(), ".config", "trakt.json")
const API_BASE = "https://api.trakt.tv"

const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((resolve) => rl.question(q, resolve))

const loadExisting = () => {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
  } catch {
    return {}
  }
}

const saveConfig = (config) => {
  mkdirSync(join(homedir(), ".config"), { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

const poll = async (deviceCode, clientId, clientSecret, interval) => {
  process.stdout.write("\nWaiting for authorization")
  while (true) {
    await new Promise((r) => setTimeout(r, interval * 1000))
    process.stdout.write(".")
    const res = await fetch(`${API_BASE}/oauth/device/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: deviceCode,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    if (res.status === 200) {
      process.stdout.write("\n")
      return await res.json()
    }
    if (res.status === 400) continue
    if (res.status === 404) throw new Error("Invalid device code")
    if (res.status === 409) throw new Error("Code already used")
    if (res.status === 410) throw new Error("Code expired — run setup again")
    if (res.status === 418) throw new Error("Denied by user")
    if (res.status === 429) await new Promise((r) => setTimeout(r, 1000))
  }
}

const existing = loadExisting()

console.log("Trakt MCP Setup")
console.log("───────────────")
console.log(
  "Create an app at https://trakt.tv/oauth/applications/new if you haven't yet.\n",
)

const clientId =
  (
    await ask(
      `Client ID${existing.clientId ? ` [${existing.clientId.slice(0, 8)}…]` : ""}: `,
    )
  ).trim() || existing.clientId
const clientSecret = (await ask("Client Secret: ")).trim()

if (!clientId || !clientSecret) {
  console.error("Both client ID and secret are required.")
  process.exit(1)
}

const deviceRes = await fetch(`${API_BASE}/oauth/device/code`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ client_id: clientId }),
})

if (!deviceRes.ok) {
  console.error(`Failed to start device flow: ${deviceRes.status}`)
  process.exit(1)
}

const { device_code, user_code, verification_url, expires_in, interval } =
  await deviceRes.json()

console.log(`\n1. Go to: ${verification_url}`)
console.log(`2. Enter code: ${user_code}\n`)

rl.close()

const token = await poll(device_code, clientId, clientSecret, interval)

saveConfig({
  clientId,
  clientSecret,
  accessToken: token.access_token,
  refreshToken: token.refresh_token,
})

console.log(`\nSaved to ${CONFIG_PATH}`)
console.log("Setup complete.")

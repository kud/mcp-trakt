import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (file: string) => readFileSync(join(root, file), "utf8")
const count = (src: string, needle: string) => src.split(needle).length - 1

// Regression guards for the two latent 403s fixed in 1.5.2:
//   - trakt-api-key: Trakt 403s any request without it — including the OAuth
//     device-flow endpoints, which the setup bootstrap originally omitted.
//   - User-Agent: Cloudflare 403s undici's header-less default request; any
//     non-empty UA gets through. Node's global fetch sends none by default.
const requiredHeaders = ["User-Agent", "trakt-api-key"]

describe("every Trakt request carries the required headers", () => {
  for (const file of ["setup.js", "src/index.ts"]) {
    const src = read(file)
    const fetches = count(src, "fetch(")

    it(`${file} makes at least one request`, () => {
      expect(fetches).toBeGreaterThan(0)
    })

    for (const header of requiredHeaders) {
      it(`${file} sends ${header} on every request`, () => {
        expect(count(src, header)).toBeGreaterThanOrEqual(fetches)
      })
    }
  }
})

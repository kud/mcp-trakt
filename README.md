```
████████╗██████╗  █████╗ ██╗  ██╗████████╗
╚══██╔══╝██╔══██╗██╔══██╗██║ ██╔╝╚══██╔══╝
   ██║   ██████╔╝███████║█████╔╝    ██║
   ██║   ██╔══██╗██╔══██║██╔═██╗    ██║
   ██║   ██║  ██║██║  ██║██║  ██╗   ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝
```

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933?logo=node.js&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-1.0-blueviolet)
![npm](https://img.shields.io/badge/npm-%40kud%2Fmcp--trakt-CB3837?logo=npm&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

**A Trakt MCP server with 53 tools for TV show and movie tracking, sync, ratings, watchlists, and checkins — straight from Claude.** 🎬📺

</div>

---

## Install

```bash
npx @kud/mcp-trakt@latest setup
```

This runs the Trakt OAuth device flow and saves your credentials to the macOS Keychain. Then add it to your MCP client:

```bash
claude mcp add trakt npx -- -y @kud/mcp-trakt@latest
```

## Development

```bash
npm run dev          # run directly with tsx, no build needed
npm run inspect:dev  # open the MCP Inspector against live tsx
npm run build        # compile TypeScript to dist/
npm run typecheck    # type-check without emitting
```

---

📚 **Full documentation → https://kud.io/projects/mcp-trakt/docs**

<div align="center">

Made with ❤️ for TV and movie fans

</div>

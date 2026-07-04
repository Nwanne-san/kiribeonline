# Figma MCP setup for Kiribe Online

## Design file

- **Figma Make (public V5 + admin prompts):** https://www.figma.com/make/iBC8YfVwanBDq1nh1VTS9f/Kiribe-Website---Figma-Make?node-id=0-9
- **File key:** `iBC8YfVwanBDq1nh1VTS9f`
- **Primary node:** `0:9`
- **Admin prompt doc:** [`docs/FIGMA-ADMIN-PROMPT.md`](./FIGMA-ADMIN-PROMPT.md) — copy-paste prompts for Figma Make (Make files are not writable via MCP)
- **Admin reference design file:** https://www.figma.com/design/5IYjhGgnhtcsgDvDOKN5O8 — key `5IYjhGgnhtcsgDvDOKN5O8`, Admin page with 20 wireframe frames

## Option A — Figma official MCP (recommended)

1. Open **Cursor Settings → MCP**
2. Add the server from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

3. Authenticate via Figma OAuth when prompted
4. Ensure your Figma account has **view access** to the Kiribe Make file

Tools: `get_design_context`, `get_figma_data` (depending on server version)

## Option B — REST token server (`user-Figma`)

If using the local Figma REST MCP:

1. Generate a personal access token at Figma → Settings → Security
2. Scope: **File content → Read-only**
3. Add token to MCP server env as `FIGMA_ACCESS_TOKEN` in Cursor settings (never commit)
4. Share the design file with the same Figma account that owns the token

## Sync workflow

After MCP works:

1. Run `get_figma_data` with file key `iBC8YfVwanBDq1nh1VTS9f`
2. Update hex values in `src/theme/tailwind.css`
3. Update component list in `docs/DESIGN.md`
4. Export assets with `download_figma_images` → `public/brand/`

## Troubleshooting 403

- Token account lacks file access — share file with that account
- Figma Make files may need the file owner to grant explicit access
- Regenerate token with correct scopes
- Try OAuth MCP instead of PAT

## Security

- Never commit tokens to git
- Rotate any token shared in chat or logs
- Use `.env.local` only for local scripts, not MCP secrets in repo

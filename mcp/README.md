# webseite-ghost-mcp

An **MCP server** that exposes the Ghost CMS to AI agents (read **and** write) over
stdio — so an agent (Claude Desktop/Code, Cursor, …) can manage the site headlessly:
read/create/update posts and pages, manage tags, and edit the homepage `site-config`.

## Build

```bash
cd mcp
npm install
npm run build
```

## Configuration

The server authenticates with a Ghost **Admin API key** (from a Custom Integration in
Ghost Admin → Settings → Integrations).

| Env | Example |
|---|---|
| `GHOST_URL` | `https://cms.example.com` |
| `GHOST_ADMIN_API_KEY` | `<id>:<secret>` |

### Example client config (Claude Desktop / Code)

```json
{
  "mcpServers": {
    "ghost": {
      "command": "node",
      "args": ["/absolute/path/to/webseite-ghost/mcp/dist/index.js"],
      "env": {
        "GHOST_URL": "https://cms.example.com",
        "GHOST_ADMIN_API_KEY": "<id>:<secret>"
      }
    }
  }
}
```

## Tools

| Tool | Purpose |
|---|---|
| `ghost_list_posts` | List posts (optional Ghost filter, limit, page) |
| `ghost_get_post` | Get a post by id or slug |
| `ghost_create_post` | Create a post (html body, status, tags, lang) |
| `ghost_update_post` | Update a post (partial; updated_at handled) |
| `ghost_delete_post` | Delete a post |
| `ghost_list_pages` / `ghost_get_page` | Read pages |
| `ghost_create_page` / `ghost_update_page` | Create/update pages (Impressum, …) |
| `ghost_list_tags` | List tags with counts |
| `ghost_get_settings` | Site settings (title, nav, accent, …) |
| `ghost_get_site_config` | Read homepage config JSON (de/en) |
| `ghost_update_site_config` | Replace homepage config JSON (de/en) |

## Smoke test

With a running Ghost:

```bash
GHOST_URL=http://localhost:2368 GHOST_ADMIN_API_KEY=<id>:<secret> npm run smoke
```

## Notes

- Writes go through the Admin API; the MCP client decides which tool calls to approve.
- `ghost_update_site_config` expects the **full** config object (hero, sections, content,
  footer) — read it first with `ghost_get_site_config`, modify, then write back.

// Smoke test: spawn the MCP server, list tools, and call a couple of them
// against a running Ghost. Requires GHOST_URL + GHOST_ADMIN_API_KEY in env.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: process.env as Record<string, string>,
});

const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log(`tools (${tools.tools.length}):`, tools.tools.map((t) => t.name).join(", "));

const settings = (await client.callTool({
  name: "ghost_get_settings",
  arguments: {},
})) as { isError?: boolean; content: { text: string }[] };
console.log("ghost_get_settings isError:", settings.isError ?? false);
const parsed = JSON.parse(settings.content[0].text);
console.log("site title:", parsed.title);

const posts = (await client.callTool({
  name: "ghost_list_posts",
  arguments: { limit: 3 },
})) as { isError?: boolean; content: { text: string }[] };
const list = JSON.parse(posts.content[0].text);
console.log("ghost_list_posts count:", Array.isArray(list) ? list.length : "n/a");

await client.close();
console.log("SMOKE OK");
process.exit(0);

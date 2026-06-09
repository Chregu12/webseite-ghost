#!/usr/bin/env node
// Bootstrap a fresh Ghost for CI / first-run: create the owner account and a
// custom integration, then print the API keys as KEY=VALUE lines (suitable for
// `node scripts/ci-bootstrap.mjs >> "$GITHUB_ENV"`).
//
//   GHOST_URL=http://localhost:2368 node scripts/ci-bootstrap.mjs
const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(/\/$/, "");
const API_VERSION = process.env.GHOST_API_VERSION ?? "v6.0";
const EMAIL = process.env.CI_GHOST_EMAIL ?? "ci@example.com";
const PASSWORD = process.env.CI_GHOST_PASSWORD ?? "CIpassword12345";
const H = {
  "Content-Type": "application/json",
  "Accept-Version": API_VERSION,
  Origin: GHOST_URL,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Setup the owner + log in, retrying while the admin API finishes booting
// (the Content API can answer before admin routes are mounted -> transient 404).
async function setupAndLogin() {
  await fetch(`${GHOST_URL}/ghost/api/admin/authentication/setup/`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      setup: [{ name: "CI", email: EMAIL, password: PASSWORD, blogTitle: "CI Blog" }],
    }),
  }).catch(() => {});

  const login = await fetch(`${GHOST_URL}/ghost/api/admin/session/`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ username: EMAIL, password: PASSWORD }),
  });
  const cookie = login.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  if (!cookie) throw new Error(`login failed (status ${login.status})`);
  return cookie;
}

async function main() {
  let cookie = "";
  let lastErr;
  for (let i = 0; i < 15; i++) {
    try {
      cookie = await setupAndLogin();
      break;
    } catch (e) {
      lastErr = e;
      await sleep(3000);
    }
  }
  if (!cookie) throw lastErr ?? new Error("could not authenticate");

  // Reuse an existing integration if present, else create one.
  const list = await (
    await fetch(`${GHOST_URL}/ghost/api/admin/integrations/?include=api_keys`, {
      headers: { ...H, Cookie: cookie },
    })
  ).json();
  let integration = (list.integrations ?? []).find((i) => i.name === "CI");

  if (!integration) {
    const created = await fetch(`${GHOST_URL}/ghost/api/admin/integrations/`, {
      method: "POST",
      headers: { ...H, Cookie: cookie },
      body: JSON.stringify({ integrations: [{ name: "CI" }] }),
    });
    integration = (await created.json()).integrations?.[0];
  }
  if (!integration) throw new Error("could not create integration");

  const content = integration.api_keys.find((k) => k.type === "content");
  const admin = integration.api_keys.find((k) => k.type === "admin");
  console.log(`GHOST_CONTENT_API_KEY=${content.secret}`);
  console.log(`GHOST_ADMIN_API_KEY=${admin.id}:${admin.secret}`);
}

main().catch((e) => {
  console.error("ci-bootstrap failed:", e);
  process.exit(1);
});

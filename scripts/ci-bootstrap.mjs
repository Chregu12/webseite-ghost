#!/usr/bin/env node
// Bootstrap a fresh Ghost for CI / first-run: create the owner account and a
// custom integration, then print the API keys as KEY=VALUE lines (suitable for
// `node scripts/ci-bootstrap.mjs >> "$GITHUB_ENV"`).
//
//   GHOST_URL=http://localhost:2368 node scripts/ci-bootstrap.mjs
const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(/\/$/, "");
const API_VERSION = process.env.GHOST_API_VERSION ?? "v6.0";
const EMAIL = process.env.CI_GHOST_EMAIL ?? "ci@example.com";
// Note: Ghost rejects "insecure" passwords (e.g. anything containing the word
// "password") with a silent-looking 422 — keep this one validation-safe.
const PASSWORD = process.env.CI_GHOST_PASSWORD ?? "Gh0st-CI-Bootstrap-77!";
const H = {
  "Content-Type": "application/json",
  "Accept-Version": API_VERSION,
  Origin: GHOST_URL,
};
const SETUP_URL = `${GHOST_URL}/ghost/api/admin/authentication/setup/`;
const SESSION_URL = `${GHOST_URL}/ghost/api/admin/session/`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET the setup status (no auth, does NOT count toward the login rate limit).
async function isSetUp() {
  try {
    const res = await fetch(SETUP_URL, { headers: H });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.setup?.[0]?.status);
  } catch {
    return false;
  }
}

// Create the owner and wait until setup is actually committed before logging in
// (logging in too early returns 404; hammering it trips the 429 rate limiter).
async function ensureSetup() {
  if (await isSetUp()) return;
  try {
    const res = await fetch(SETUP_URL, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        setup: [{ name: "CI", email: EMAIL, password: PASSWORD, blogTitle: "CI Blog" }],
      }),
    });
    if (!res.ok) {
      // Surface the real reason (e.g. Ghost's "insecure password" 422) instead
      // of silently timing out below.
      const body = await res.text().catch(() => "");
      console.error(`setup POST -> HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
  } catch (e) {
    console.error("setup POST failed:", e);
  }
  for (let i = 0; i < 20; i++) {
    if (await isSetUp()) return;
    await sleep(3000);
  }
  throw new Error("Ghost setup did not complete");
}

async function loginOnce() {
  const res = await fetch(SESSION_URL, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ username: EMAIL, password: PASSWORD }),
  });
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return { status: res.status, cookie };
}

async function login() {
  let { status, cookie } = await loginOnce();
  if (status === 201 && cookie) return cookie;
  // Back off once if rate-limited, then try a final time.
  if (status === 429) {
    await sleep(65000);
    ({ status, cookie } = await loginOnce());
    if (status === 201 && cookie) return cookie;
  }
  throw new Error(`login failed (status ${status})`);
}

async function main() {
  await ensureSetup();
  const cookie = await login();
  const authed = { ...H, Cookie: cookie };

  // Reuse an existing integration if present, else create one.
  const list = await (
    await fetch(`${GHOST_URL}/ghost/api/admin/integrations/?include=api_keys`, {
      headers: authed,
    })
  ).json();
  let integration = (list.integrations ?? []).find((i) => i.name === "CI");

  if (!integration) {
    const created = await fetch(`${GHOST_URL}/ghost/api/admin/integrations/`, {
      method: "POST",
      headers: authed,
      body: JSON.stringify({ integrations: [{ name: "CI" }] }),
    });
    integration = (await created.json()).integrations?.[0];
  }
  if (!integration) throw new Error("could not create integration");

  const content = integration.api_keys.find((k) => k.type === "content");
  const admin = integration.api_keys.find((k) => k.type === "admin");
  // The API serializes admin-key secrets as "id:secret" already — don't prefix
  // the id again or JWT signing uses the wrong half (invalid signature).
  const adminKey = admin.secret.includes(":")
    ? admin.secret
    : `${admin.id}:${admin.secret}`;
  console.log(`GHOST_CONTENT_API_KEY=${content.secret}`);
  console.log(`GHOST_ADMIN_API_KEY=${adminKey}`);
}

main().catch((e) => {
  console.error("ci-bootstrap failed:", e);
  process.exit(1);
});

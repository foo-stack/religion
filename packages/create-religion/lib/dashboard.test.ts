import { test } from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { CONTENT_SECURITY_POLICY, isOwnHost, startDashboard } from "./dashboard.js";

test("isOwnHost accepts the loopback address and localhost on its own port", () => {
  assert.equal(isOwnHost("127.0.0.1:4321", 4321), true);
  assert.equal(isOwnHost("localhost:4321", 4321), true);
  assert.equal(isOwnHost("LocalHost:4321", 4321), true);
});

test("isOwnHost refuses a missing header", () => {
  assert.equal(isOwnHost(undefined, 4321), false);
  assert.equal(isOwnHost("", 4321), false);
});

test("isOwnHost refuses a foreign host, even one rebound to loopback", () => {
  assert.equal(isOwnHost("evil.example:4321", 4321), false);
  assert.equal(isOwnHost("evil.example", 4321), false);
});

test("isOwnHost refuses the wrong port, a missing port, and IPv6 loopback", () => {
  assert.equal(isOwnHost("127.0.0.1:4322", 4321), false);
  assert.equal(isOwnHost("localhost", 4321), false);
  assert.equal(isOwnHost("[::1]:4321", 4321), false);
});

function get(url: string, host: string): Promise<{ status: number; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { headers: { host } }, (response) => {
      response.resume();
      resolve({ status: response.statusCode ?? 0, headers: response.headers });
    });
    request.on("error", reject);
  });
}

test("the dashboard binds loopback, refuses a foreign host, and confines every response", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "religion-dashboard-"));
  const dashboard = await startDashboard(root);
  t.after(async () => {
    await dashboard.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  const own = new URL(dashboard.url).host;

  assert.equal(dashboard.address, "127.0.0.1");
  const refused = await get(`${dashboard.url}/state.json`, "evil.example");
  const data = await get(`${dashboard.url}/state.json`, own);
  const page = await get(`${dashboard.url}/`, own);
  const other = await get(`${dashboard.url}/anything-else`, own);
  assert.deepEqual([refused.status, data.status, page.status, other.status], [403, 200, 200, 200]);

  assert.equal(
    CONTENT_SECURITY_POLICY,
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'"
  );
  for (const response of [refused, data, page, other]) {
    assert.equal(response.headers["content-security-policy"], CONTENT_SECURITY_POLICY, "every response carries the exact policy");
  }
});


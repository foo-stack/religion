import { test } from "node:test";
import assert from "node:assert/strict";

import { isOwnHost } from "./dashboard.js";

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

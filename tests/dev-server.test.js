import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { PassThrough } from "node:stream";

import { createRequestHandler, defaultRoot } from "../scripts/dev-server.mjs";

test("dev server serves the app shell from the project root", async () => {
  const response = await request("/");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["Content-Type"], "text/html; charset=utf-8");
  assert.match(response.body, /<title>Snake<\/title>/);
  assert.match(response.body, /id="board"/);
});

test("dev server returns 404 for missing files", async () => {
  const response = await request("/missing-file.js");

  assert.equal(response.statusCode, 404);
  assert.equal(response.body, "Not found");
});

test("dev server blocks directory traversal", async () => {
  const response = await request("/../package.json");

  assert.equal(response.statusCode, 403);
  assert.equal(response.body, "Forbidden");
});

async function request(url) {
  const body = [];
  const response = new MockResponse();
  const handler = createRequestHandler(defaultRoot);

  response.on("data", (chunk) => {
    body.push(Buffer.from(chunk));
  });

  handler({ url }, response);
  await once(response, "finish");

  return {
    body: Buffer.concat(body).toString("utf8"),
    headers: response.headers,
    statusCode: response.statusCode
  };
}

class MockResponse extends PassThrough {
  constructor() {
    super();
    this.headers = {};
    this.statusCode = 200;
  }

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
    return this;
  }
}

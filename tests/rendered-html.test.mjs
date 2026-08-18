import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the official crime and recent activity page", async () => {
  const response = await render("/crime");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<title>Crime &amp; Recent Activity/);
  assert.match(html, /Explore official Winnipeg Police Service crime and calls-for-service information/);
  assert.match(html, /Crime &amp; Recent Activity/);
  assert.match(html, /updated monthly/i);
  assert.match(html, /previous 10 weeks/i);
  assert.match(html, /generalized/i);
  assert.match(html, /https:\/\/wps-crime-calls-for-service-wpsgis\.hub\.arcgis\.com\//);
  assert.doesNotMatch(html, /\/og\.png/);
});

test("server-renders the Winnipeg resource map experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<title>Winnipeg Neighbourhood &amp; Resource Map/);
  assert.match(html, /Find the right support\. Understand the neighbourhood\./);
  assert.match(html, /Explore the map/);
  assert.match(html, /Browse directory/);
  assert.match(html, /Mental Health \/ Addictions/);
  assert.match(html, /Youth \/ Young Adults/);
  assert.match(html, /Emergency help/);
  assert.match(html, /Information, not a safety score/);
  assert.match(html, /href="\/crime"/);
  assert.doesNotMatch(html, /Rate \/ 1,000|Raw count|12-month trend|Official density/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton|codex-preview/);
});

test("removes the disposable preview and protects confidential location data", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  const [page, layout, services] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/services.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.match(layout, /Winnipeg Neighbourhood & Resource Map/);
  assert.match(services, /visibility: "Confidential"/);
  assert.doesNotMatch(services, /confidential-(?:willow|ikwe)[\s\S]{0,180}(?:address|latitude|longitude):/i);
});

test("describes the directory as reviewed rather than exhaustive", async () => {
  const report = JSON.parse(
    await readFile(new URL("../public/freshness-report.json", import.meta.url), "utf8"),
  );

  assert.match(report.statement, /reviewed directory/i);
  assert.doesNotMatch(report.statement, /comprehensive/i);
});

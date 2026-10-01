import assert from "node:assert/strict";
import test from "node:test";
import { HttpCatalogClient } from "./catalog-client.js";

test("uses the versioned catalog API contract", async () => {
  const calls: URL[] = [];
  const fetcher = async (input: URL | RequestInfo) => {
    const url = new URL(String(input));
    calls.push(url);
    if (url.pathname.endsWith("/models/mdl_one")) return Response.json({ data: { id: "mdl_one" } });
    if (url.pathname.endsWith("/compare/models")) return Response.json({ data: [{ id: "one" }, { id: "two" }] });
    if (url.pathname.endsWith("/freshness")) return Response.json({ modelCount: 462 });
    return Response.json({ data: [], meta: { total: 0 } });
  };
  const client = new HttpCatalogClient("https://api.awba.test", fetcher as typeof fetch);

  const search = await client.searchModels({ query: "claude", publisher: "anthropic", modality: "text", sort: "name", limit: 5 });
  assert.deepEqual(search.meta, { total: 0 });
  assert.equal(calls[0].pathname, "/v1/catalog/models");
  assert.equal(calls[0].searchParams.get("search"), "claude");
  assert.equal(calls[0].searchParams.get("publisher"), "anthropic");
  assert.equal(calls[0].searchParams.get("modality"), "text");
  assert.equal(calls[0].searchParams.get("sort"), "name");
  assert.equal(calls[0].searchParams.get("limit"), "5");

  assert.equal((await client.getModel("mdl_one")).id, "mdl_one");
  assert.deepEqual((await client.compareModels(["one", "two"])).map((model) => model.id), ["one", "two"]);
  assert.deepEqual(await client.getFreshness(), { modelCount: 462 });
  assert.deepEqual(calls.map((url) => url.pathname).slice(1), [
    "/v1/catalog/models/mdl_one",
    "/v1/catalog/compare/models",
    "/v1/platform/freshness",
  ]);
});

test("applies search defaults and exposes API failures", async () => {
  let requested = "";
  const success = new HttpCatalogClient("https://api.awba.test", (async (input: URL | RequestInfo) => {
    requested = String(input);
    return Response.json({ data: [], meta: {} });
  }) as typeof fetch);
  await success.searchModels({});
  assert.equal(new URL(requested).searchParams.get("limit"), "10");

  const failure = new HttpCatalogClient("https://api.awba.test", (async () => new Response("database unavailable", { status: 503 })) as typeof fetch);
  await assert.rejects(() => failure.getModel("one/two"), /Awba API returned 503: database unavailable/);
});

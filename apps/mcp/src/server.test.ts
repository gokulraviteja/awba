import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import type { CatalogClient, Model } from "./catalog-client.js";
import { createAwbaMcpServer } from "./server.js";

const model: Model = {
  id: "mdl_test",
  sourceId: "acme/model",
  canonicalSlug: "acme/model-2026",
  name: "Acme Model",
  publisher: { id: "acme", name: "Acme" },
  family: null,
  releasedAt: "2026-01-01T00:00:00Z",
  status: "active",
  isAlias: true,
  contextWindowTokens: 100_000,
  maxOutputTokens: 16_000,
  architecture: { modality: "text->text", inputModalities: ["text"], outputModalities: ["text"] },
  servingRoutes: [{
    aggregator: { id: "openrouter", name: "OpenRouter" },
    inferenceProvider: null,
    observedAt: "2026-10-01T00:00:00Z",
    pricing: {
      currency: "USD", unit: "per_million_tokens", inputPerMillion: 1, outputPerMillion: 4,
      cacheReadPerMillion: null, cacheWritePerMillion: null, request: null, image: null,
    },
  }],
  benchmarks: [],
  source: { name: "OpenRouter", url: "https://openrouter.ai/api/v1/models", observedAt: "2026-10-01T00:00:00Z" },
};

const catalogClient: CatalogClient = {
  async searchModels() { return { data: [model], meta: { total: 1 } }; },
  async getModel() { return model; },
  async compareModels() { return [model, { ...model, id: "mdl_other", name: "Other Model" }]; },
  async getFreshness() { return { modelCount: 1, schemaVersion: "poc-v1" }; },
};

async function connectedClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createAwbaMcpServer(catalogClient);
  const client = new Client({ name: "awba-mcp-test", version: "0.1.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

test("exposes the read-only catalog tools", async () => {
  const { client, server } = await connectedClient();
  const tools = await client.listTools();
  assert.deepEqual(
    tools.tools.map((tool) => tool.name),
    ["search_models", "get_model", "compare_models", "get_model_pricing", "get_benchmark_results", "get_catalog_freshness"],
  );
  assert.ok(tools.tools.every((tool) => tool.annotations?.readOnlyHint));
  await client.close();
  await server.close();
});

test("returns normalized structured model data", async () => {
  const { client, server } = await connectedClient();
  const response = await client.callTool({ name: "search_models", arguments: { query: "acme", limit: 5 } });
  assert.equal(response.isError, undefined);
  assert.equal((response.structuredContent as { models: Model[] }).models[0].canonicalSlug, "acme/model-2026");
  await client.close();
  await server.close();
});

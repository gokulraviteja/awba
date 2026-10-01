import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import type { CatalogClient, Model } from "./catalog-client.js";
import { HttpCatalogClient } from "./catalog-client.js";

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function routePricing(model: Model) {
  return model.servingRoutes.map((route) => ({
    aggregator: route.aggregator,
    inferenceProvider: route.inferenceProvider,
    pricing: route.pricing,
    observedAt: route.observedAt,
  }));
}

function summary(model: Model) {
  return {
    id: model.id,
    sourceId: model.sourceId,
    canonicalSlug: model.canonicalSlug,
    name: model.name,
    publisher: model.publisher,
    releasedAt: model.releasedAt,
    contextWindowTokens: model.contextWindowTokens ?? null,
    maxOutputTokens: model.maxOutputTokens ?? null,
    modalities: model.architecture,
    pricing: routePricing(model),
    benchmarks: model.benchmarks.map(({ key, name, category, score, scale }) => ({ key, name, category, score, scale })),
  };
}

function result(value: Record<string, unknown>, message: string) {
  return {
    structuredContent: value,
    content: [{ type: "text" as const, text: `${message}\n\n${JSON.stringify(value, null, 2)}` }],
  };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown catalog error";
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

export function createAwbaMcpServer(client: CatalogClient = new HttpCatalogClient()) {
  const server = new McpServer(
    { name: "awba-catalog", version: "0.1.0" },
    { instructions: "Use these read-only tools to inspect Awba's normalized AI model catalog. Null values are unknown, not zero." },
  );

  server.registerTool(
    "search_models",
    {
      title: "Search AI models",
      description: "Search the normalized Awba model catalog and filter by publisher or modality.",
      inputSchema: {
        query: z.string().trim().max(100).optional().describe("Free-text model or publisher search"),
        publisher: z.string().trim().max(100).optional().describe("Exact publisher identifier"),
        modality: z.string().trim().max(40).optional().describe("Input or output modality, such as text or image"),
        sort: z.enum(["newest", "name", "context", "input-price", "output-price"]).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      },
      annotations: readOnly,
    },
    async (input) => {
      try {
        const response = await client.searchModels(input);
        const models = response.data.map(summary);
        return result({ models, meta: response.meta }, `Found ${models.length} model(s).`);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_model",
    {
      title: "Get an AI model",
      description: "Get the complete normalized record for one model by Awba ID, source ID, or canonical slug.",
      inputSchema: { modelId: z.string().trim().min(1).max(240) },
      annotations: readOnly,
    },
    async ({ modelId }) => {
      try {
        const model = await client.getModel(modelId);
        return result({ model }, `Loaded ${model.name}.`);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "compare_models",
    {
      title: "Compare AI models",
      description: "Compare two to four normalized models, including context, modalities, route pricing, and benchmark scores.",
      inputSchema: { modelIds: z.array(z.string().trim().min(1).max(240)).min(2).max(4) },
      annotations: readOnly,
    },
    async ({ modelIds }) => {
      try {
        const models = (await client.compareModels(modelIds)).map(summary);
        return result({ models }, `Compared ${models.length} models.`);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_model_pricing",
    {
      title: "Get model pricing",
      description: "Get route-level model pricing with aggregator, underlying provider when known, units, and observation time.",
      inputSchema: { modelId: z.string().trim().min(1).max(240) },
      annotations: readOnly,
    },
    async ({ modelId }) => {
      try {
        const model = await client.getModel(modelId);
        return result(
          { model: { id: model.id, name: model.name, canonicalSlug: model.canonicalSlug }, routes: routePricing(model) },
          `Loaded pricing for ${model.name}.`,
        );
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_benchmark_results",
    {
      title: "Get model benchmarks",
      description: "Get benchmark results with source, harness metadata when available, and evaluation time.",
      inputSchema: { modelId: z.string().trim().min(1).max(240) },
      annotations: readOnly,
    },
    async ({ modelId }) => {
      try {
        const model = await client.getModel(modelId);
        return result(
          { model: { id: model.id, name: model.name, canonicalSlug: model.canonicalSlug }, benchmarks: model.benchmarks },
          `Loaded ${model.benchmarks.length} benchmark result(s) for ${model.name}.`,
        );
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_catalog_freshness",
    {
      title: "Get catalog freshness",
      description: "Inspect the source snapshot time, model count, schema version, and age of the current catalog.",
      annotations: readOnly,
    },
    async () => {
      try {
        const freshness = await client.getFreshness();
        return result({ freshness }, "Loaded catalog freshness.");
      } catch (error) {
        return failure(error);
      }
    },
  );

  return server;
}

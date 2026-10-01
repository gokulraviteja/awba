export interface Party {
  id: string;
  name: string;
}

export interface Pricing {
  currency: string;
  unit: string;
  inputPerMillion: number | null;
  outputPerMillion: number | null;
  cacheReadPerMillion: number | null;
  cacheWritePerMillion: number | null;
  request: number | null;
  image: number | null;
}

export interface BenchmarkResult {
  key: string;
  name: string;
  category: string;
  score: number;
  scale: string;
  source: { name: string; url: string; observedAt: string };
  harness: { name: string; version?: string } | null;
  evaluatedAt: string | null;
}

export interface Model {
  id: string;
  sourceId: string;
  canonicalSlug: string;
  name: string;
  description?: string;
  publisher: Party;
  family: string | null;
  releasedAt: string | null;
  status: string;
  isAlias: boolean;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
  architecture: {
    modality?: string;
    inputModalities: string[];
    outputModalities: string[];
    tokenizer?: string;
  };
  supportedParameters?: string[];
  servingRoutes: Array<{
    aggregator: Party;
    inferenceProvider: Party | null;
    pricing: Pricing;
    observedAt: string;
  }>;
  benchmarks: BenchmarkResult[];
  source: { name: string; externalId?: string; url: string; observedAt: string };
}

export interface SearchModelsParams {
  query?: string;
  publisher?: string;
  modality?: string;
  sort?: "newest" | "name" | "context" | "input-price" | "output-price";
  limit?: number;
}

export interface CatalogClient {
  searchModels(params: SearchModelsParams): Promise<{ data: Model[]; meta: Record<string, unknown> }>;
  getModel(id: string): Promise<Model>;
  compareModels(ids: string[]): Promise<Model[]>;
  getFreshness(): Promise<Record<string, unknown>>;
}

export class HttpCatalogClient implements CatalogClient {
  constructor(
    private readonly baseUrl = process.env.AWBA_API_URL ?? "http://127.0.0.1:8080",
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async searchModels(params: SearchModelsParams) {
    const query = new URLSearchParams();
    if (params.query) query.set("search", params.query);
    if (params.publisher) query.set("publisher", params.publisher);
    if (params.modality) query.set("modality", params.modality);
    if (params.sort) query.set("sort", params.sort);
    query.set("limit", String(params.limit ?? 10));
    return this.request<{ data: Model[]; meta: Record<string, unknown> }>(`/v1/catalog/models?${query}`);
  }

  async getModel(id: string) {
    const response = await this.request<{ data: Model }>(`/v1/catalog/models/${encodeURIComponent(id)}`);
    return response.data;
  }

  async compareModels(ids: string[]) {
    const query = new URLSearchParams({ ids: ids.join(",") });
    const response = await this.request<{ data: Model[] }>(`/v1/catalog/compare/models?${query}`);
    return response.data;
  }

  async getFreshness() {
    return this.request<Record<string, unknown>>("/v1/platform/freshness");
  }

  private async request<T>(path: string): Promise<T> {
    const response = await this.fetcher(new URL(path, this.baseUrl), {
      headers: { Accept: "application/json", "User-Agent": "awba-mcp/0.1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Awba API returned ${response.status}${detail ? `: ${detail}` : ""}`);
    }
    return (await response.json()) as T;
  }
}

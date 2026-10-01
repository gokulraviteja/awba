# Awba

Awba is a developer-stack platform in progress. Its first module is a normalized catalog of AI models, publishers, serving routes, prices, capabilities, and benchmark results.

This repository contains the Awba web application and MCP protocol adapter:

- A React/Vite catalog UI with search, filters, model details, and comparison
- An interactive LLD data-model workbench covering all provisional entities, columns, sources, and design gaps
- A typed client for the separate Go HTTP API
- A representative offline snapshot for graceful frontend fallback
- A read-only TypeScript MCP server that delegates to the Go API
- End-to-end browser coverage for the catalog and LLD workflows

## Documentation

- [Production architecture](docs/architecture.md)
- [Live-source data-model findings](docs/data-model-findings.md)

## Repository layout

```text
apps/mcp/      TypeScript MCP protocol adapter
docs/          Architecture and generated data findings
public/        Small committed catalog snapshot used as an offline UI fallback
src/           React catalog UI
tests/e2e/     Playwright browser tests
```

The production backend lives in the separate [`gokulraviteja/awba-backend`](https://github.com/gokulraviteja/awba-backend) repository. Clone both repositories as siblings so the development scripts can start and test them together.

The reusable product mark lives at [`public/brand/awba-mark.svg`](public/brand/awba-mark.svg); the site uses the same geometry as an inline, theme-aware logo and favicon.

## Prerequisites

- Node.js 20 or newer
- Go 1.25 or newer

## Run locally

Install both JavaScript dependency sets:

```bash
npm install
npm --prefix apps/mcp install
```

Refresh the source snapshot (network access required):

```bash
npm run ingest
```

Start the API and web UI:

```bash
npm run dev:full
```

Open `http://localhost:5173`. The UI calls the Go API through Vite's `/api` proxy and falls back to `public/catalog.sample.json` when the API is unavailable.

Open `http://localhost:5173/#schema` (or select **Data model** in the header) for the entity-by-entity LLD workbench.

To run the API, UI, and MCP service together:

```bash
npm run dev:all
```

The defaults are:

| Service | Address |
| --- | --- |
| Web UI | `http://localhost:5173` |
| Go API | `http://127.0.0.1:8080` |
| MCP Streamable HTTP | `http://127.0.0.1:8787/mcp` |

Set `AWBA_API_URL`, `AWBA_API_PROXY`, `MCP_HOST`, or `MCP_PORT` to override service locations. The MCP server can also run over stdio with `MCP_TRANSPORT=stdio npm run mcp:dev`.

## API surface

```text
GET /healthz
GET /v1/catalog/models
GET /v1/catalog/models/{id}
GET /v1/catalog/publishers
GET /v1/catalog/compare/models?ids={id},{id}
GET /v1/benchmarks
GET /v1/platform/freshness
```

The initial MCP surface exposes `search_models`, `get_model`, `compare_models`, `get_model_pricing`, `get_benchmark_results`, and `get_catalog_freshness`. All tools are read-only. Private account and diagnostic tools remain a later authenticated phase.

## Verification

```bash
npm run check
```

This runs the backend test suite, MCP tests and type-check/build, the production frontend build, and Playwright end-to-end tests.

## Deployment direction

The production target is AWS: CloudFront/S3 for the frontend, an Application Load Balancer with ECS/Fargate services for the Go API and MCP adapter, RDS PostgreSQL, SQS-backed ingestion workers, and EventBridge schedules. The backend already provides PostgreSQL persistence plus file-backed local development; AWS infrastructure remains the next deployment phase.

The existing public site is deployed with Vercel at [awba.dev](https://awba.dev). The production migration plan and service boundaries are described in the architecture document.

# Awba POC Data Model Findings

**Generated:** 2026-10-01T10:26:17Z
**Source:** [OpenRouter](https://openrouter.ai/api/v1/models)
**Models inspected:** 462 across 64 publisher identifiers

This report is generated from the live source payload used by the Awba POC. The figures describe source coverage, not guaranteed model facts. They are evidence for the provisional schema in the architecture document.

## Field coverage

| Field | Models | Coverage |
| --- | ---: | ---: |
| Canonical slug | 462 | 100.0% |
| Release timestamp | 462 | 100.0% |
| Context window | 462 | 100.0% |
| Maximum output tokens | 455 | 98.5% |
| Input price | 456 | 98.7% |
| Output price | 456 | 98.7% |
| Any Artificial Analysis index | 193 | 41.8% |
| Intelligence index | 146 | 31.6% |
| Coding index | 177 | 38.3% |
| Agentic index | 139 | 30.1% |
| Underlying inference provider | 0 | 0.0% |
| Source ID differs from canonical slug | 310 | 67.1% |

## Largest publisher identifiers

| Publisher identifier | Models |
| --- | ---: |
| `openai` | 102 |
| `qwen` | 54 |
| `google` | 41 |
| `anthropic` | 29 |
| `mistralai` | 25 |
| `z-ai` | 18 |
| `deepseek` | 15 |
| `nvidia` | 10 |
| `minimax` | 8 |
| `moonshotai` | 8 |
| `meta-llama` | 8 |
| `x-ai` | 8 |
| `tencent` | 7 |
| `meta` | 6 |
| `cohere` | 6 |

## Schema findings

- The source ID prefix is useful as a publisher identifier, but it does not prove which infrastructure provider serves a request.
- Pricing is attached to the OpenRouter route. The payload does not identify the underlying inference provider for this normalized route, so that field remains null.
- The source exposes mutable IDs and canonical slugs. Awba stores both and assigns its own stable identifier.
- Model-family membership is not reliably present and remains null rather than being guessed from names.
- Benchmark indices are sparse and do not include a complete harness version in the model payload. Awba stores the source but leaves the harness reference null.
- Prices arrive as decimal strings per token. The POC converts token prices to USD per million tokens while retaining the source snapshot.
- Some routing products use negative numbers as pricing sentinels. Awba treats those values as unavailable, not as a real negative price.
- Publisher namespaces contain aliases (including identifiers prefixed with `~`) and semantically similar IDs. They remain separate until a reviewed identity mapping exists.
- Release timestamps represent the source's created time and require verification against official publisher release information.

## Decisions for the next iteration

1. Add a second pricing source before treating direct-provider and aggregator prices as equivalent.
2. Test the dedicated benchmark endpoint to determine which harness, version, and evaluation timestamps are available.
3. Create reviewed mappings for model families and aliases instead of name-based automatic assignment.
4. Model inference endpoints separately from publishers and aggregators.
5. Confirm source attribution and redistribution terms before public launch.

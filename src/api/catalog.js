const API_BASE = import.meta.env.VITE_AWBA_API_BASE ?? '/api'

async function get(path, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`Awba API returned ${response.status}`)
  return response.json()
}

export async function loadCatalog(signal) {
  const [models, freshness] = await Promise.all([
    get('/v1/catalog/models?limit=500', signal),
    get('/v1/platform/freshness', signal),
  ])
  return {
    schemaVersion: freshness.schemaVersion,
    retrievedAt: freshness.retrievedAt,
    source: freshness.source,
    models: models.data,
  }
}

export const catalogApiUrl = `${API_BASE}/v1/platform/freshness`

import { useEffect, useMemo, useState } from 'react'
import LogoMark from './components/LogoMark'
import SchemaExplorer from './components/SchemaExplorer'
import ThreeScene from './components/ThreeScene'
import { catalogApiUrl, loadCatalog } from './api/catalog'

const FALLBACK_URL = '/catalog.sample.json'

function initialTheme() {
  const saved = window.localStorage.getItem('awba-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function formatMoney(value) {
  if (value == null) return '—'
  if (value === 0) return 'Free'
  if (value < 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(2)}`
}

function formatTokens(value) {
  if (!value) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return new Intl.NumberFormat('en-US').format(value)
}

function benchmark(model, key) {
  return model.benchmarks?.find((item) => item.key === key)?.score ?? null
}

function route(model) {
  return model.servingRoutes?.[0] ?? { pricing: {} }
}

function dateLabel(value) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function relativeTime(value) {
  if (!value) return 'unknown'
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function Score({ label, value }) {
  return (
    <div className="score-cell" title={`${label}: ${value ?? 'not available'}`}>
      <span>{label.slice(0, 3).toUpperCase()}</span>
      <div className="score-bar"><i style={{ width: `${Math.min(value ?? 0, 100)}%` }} /></div>
      <strong>{value == null ? '—' : value.toFixed(1)}</strong>
    </div>
  )
}

function ModelRow({ model, selected, onSelect, onOpen }) {
  const pricing = route(model).pricing ?? {}
  return (
    <article className="model-row">
      <label className="compare-check" title="Add to comparison">
        <input type="checkbox" checked={selected} onChange={() => onSelect(model)} />
        <span />
      </label>
      <button className="model-identity" onClick={() => onOpen(model)}>
        <span className="publisher-dot" data-publisher={model.publisher.id}>{model.publisher.name.slice(0, 1)}</span>
        <span>
          <strong>{model.name}</strong>
          <small>{model.publisher.name} · {model.status}</small>
        </span>
      </button>
      <div className="model-numbers price-pair">
        <span><small>IN</small>{formatMoney(pricing.inputPerMillion)}</span>
        <span><small>OUT</small>{formatMoney(pricing.outputPerMillion)}</span>
      </div>
      <div className="model-numbers context-value">
        <strong>{formatTokens(model.contextWindowTokens)}</strong>
        <small>{formatTokens(model.maxOutputTokens)} output</small>
      </div>
      <div className="modality-list">
        {[...(model.architecture?.inputModalities ?? []), ...(model.architecture?.outputModalities ?? [])]
          .filter((item, index, all) => all.indexOf(item) === index)
          .slice(0, 3)
          .map((item) => <span key={item}>{item}</span>)}
      </div>
      <div className="row-scores">
        <Score label="Intelligence" value={benchmark(model, 'intelligence')} />
        <Score label="Coding" value={benchmark(model, 'coding')} />
        <Score label="Agentic" value={benchmark(model, 'agentic')} />
      </div>
      <button className="row-arrow" onClick={() => onOpen(model)} aria-label={`Open ${model.name}`}>↗</button>
    </article>
  )
}

function DetailPanel({ model, onClose, onCompare, selected }) {
  if (!model) return null
  const servingRoute = route(model)
  const pricing = servingRoute.pricing ?? {}
  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-panel" aria-label={`${model.name} details`}>
        <div className="drawer-header">
          <div><span className="kicker">MODEL RECORD</span><h2>{model.name}</h2><p>{model.publisher.name}</p></div>
          <button onClick={onClose} aria-label="Close details">×</button>
        </div>

        <p className="detail-description">{model.description || 'No description was supplied by this source.'}</p>

        <div className="detail-actions">
          <button className={selected ? 'secondary active' : 'secondary'} onClick={() => onCompare(model)}>
            {selected ? 'Remove from comparison' : 'Add to comparison'}
          </button>
          <a href={model.source.url} target="_blank" rel="noreferrer">Source ↗</a>
        </div>

        <section className="detail-section">
          <h3>Identity</h3>
          <dl>
            <div><dt>Awba ID</dt><dd>{model.id}</dd></div>
            <div><dt>Source ID</dt><dd>{model.sourceId}</dd></div>
            <div><dt>Canonical slug</dt><dd>{model.canonicalSlug}</dd></div>
            <div><dt>Family</dt><dd>{model.family ?? 'Not supplied'}</dd></div>
            <div><dt>Source created</dt><dd>{dateLabel(model.releasedAt)}</dd></div>
          </dl>
        </section>

        <section className="detail-section">
          <h3>Pricing through {servingRoute.aggregator?.name ?? 'source route'}</h3>
          <div className="metric-grid">
            <div><span>Input / MTok</span><strong>{formatMoney(pricing.inputPerMillion)}</strong></div>
            <div><span>Output / MTok</span><strong>{formatMoney(pricing.outputPerMillion)}</strong></div>
            <div><span>Cache read</span><strong>{formatMoney(pricing.cacheReadPerMillion)}</strong></div>
            <div><span>Cache write</span><strong>{formatMoney(pricing.cacheWritePerMillion)}</strong></div>
          </div>
          {!servingRoute.inferenceProvider && <p className="data-note">Underlying inference provider is not supplied by this catalog endpoint.</p>}
        </section>

        <section className="detail-section">
          <h3>Benchmarks</h3>
          {model.benchmarks?.length ? model.benchmarks.map((item) => (
            <div className="benchmark-line" key={item.key}>
              <span><strong>{item.name}</strong><small>{item.source.name}</small></span>
              <b>{item.score.toFixed(1)}</b>
            </div>
          )) : <p className="empty-copy">No normalized benchmark result is present for this model.</p>}
        </section>

        <section className="detail-section">
          <h3>Supported parameters</h3>
          <div className="tag-cloud">
            {model.supportedParameters?.map((parameter) => <span key={parameter}>{parameter}</span>)}
          </div>
        </section>
      </aside>
    </div>
  )
}

function ComparePanel({ models, onClose, onRemove }) {
  if (!models.length) return null
  const attributes = [
    ['Publisher', (model) => model.publisher.name],
    ['Context', (model) => formatTokens(model.contextWindowTokens)],
    ['Max output', (model) => formatTokens(model.maxOutputTokens)],
    ['Input / MTok', (model) => formatMoney(route(model).pricing?.inputPerMillion)],
    ['Output / MTok', (model) => formatMoney(route(model).pricing?.outputPerMillion)],
    ['Intelligence', (model) => benchmark(model, 'intelligence')?.toFixed(1) ?? '—'],
    ['Coding', (model) => benchmark(model, 'coding')?.toFixed(1) ?? '—'],
    ['Agentic', (model) => benchmark(model, 'agentic')?.toFixed(1) ?? '—'],
    ['Source created', (model) => dateLabel(model.releasedAt)],
  ]
  return (
    <div className="compare-modal">
      <div className="compare-dialog">
        <div className="drawer-header">
          <div><span className="kicker">SIDE BY SIDE</span><h2>Model comparison</h2></div>
          <button onClick={onClose}>×</button>
        </div>
        <div className="comparison-table" style={{ '--model-count': models.length }}>
          <div className="comparison-heading"><span>Attribute</span></div>
          {models.map((model) => (
            <div className="comparison-heading" key={model.id}>
              <strong>{model.name}</strong>
              <small>{model.publisher.name}</small>
              <button onClick={() => onRemove(model)}>Remove</button>
            </div>
          ))}
          {attributes.flatMap(([label, getter]) => [
            <div className="comparison-label" key={`${label}-label`}>{label}</div>,
            ...models.map((model) => <div className="comparison-value" key={`${label}-${model.id}`}>{getter(model)}</div>),
          ])}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme)
  const [page, setPage] = useState(window.location.hash === '#schema' ? 'schema' : 'models')
  const [catalog, setCatalog] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [sourceMode, setSourceMode] = useState('live')
  const [query, setQuery] = useState('')
  const [publisher, setPublisher] = useState('all')
  const [modality, setModality] = useState('all')
  const [sort, setSort] = useState('newest')
  const [limit, setLimit] = useState(30)
  const [detail, setDetail] = useState(null)
  const [selected, setSelected] = useState([])
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080a0d' : '#f4f6f1')
    window.localStorage.setItem('awba-theme', theme)
  }, [theme])

  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash === '#schema' ? 'schema' : 'models')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        setCatalog(await loadCatalog(controller.signal))
      } catch (error) {
        if (error.name === 'AbortError') return
        try {
          const response = await fetch(FALLBACK_URL, { signal: controller.signal })
          if (!response.ok) throw new Error('sample unavailable')
          setCatalog(await response.json())
          setSourceMode('sample')
        } catch (fallbackError) {
          if (fallbackError.name !== 'AbortError') setLoadError('Neither the Awba API nor the sample catalog could be loaded.')
        }
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const publishers = useMemo(() => {
    const counts = new Map()
    for (const model of catalog?.models ?? []) {
      const current = counts.get(model.publisher.id) ?? { ...model.publisher, count: 0 }
      current.count++
      counts.set(model.publisher.id, current)
    }
    return [...counts.values()].sort((a, b) => b.count - a.count)
  }, [catalog])

  const models = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const result = (catalog?.models ?? []).filter((model) => {
      const queryMatch = !needle || `${model.name} ${model.publisher.name} ${model.sourceId}`.toLowerCase().includes(needle)
      const publisherMatch = publisher === 'all' || model.publisher.id === publisher
      const modalities = [...(model.architecture?.inputModalities ?? []), ...(model.architecture?.outputModalities ?? [])]
      const modalityMatch = modality === 'all' || modalities.includes(modality)
      return queryMatch && publisherMatch && modalityMatch
    })
    return result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'context') return b.contextWindowTokens - a.contextWindowTokens
      if (sort === 'price') return (route(a).pricing?.inputPerMillion ?? Infinity) - (route(b).pricing?.inputPerMillion ?? Infinity)
      if (sort === 'intelligence') return (benchmark(b, 'intelligence') ?? -1) - (benchmark(a, 'intelligence') ?? -1)
      return new Date(b.releasedAt ?? 0) - new Date(a.releasedAt ?? 0)
    })
  }, [catalog, modality, publisher, query, sort])

  useEffect(() => setLimit(30), [modality, publisher, query, sort])

  function toggleSelected(model) {
    setSelected((current) => {
      if (current.some((item) => item.id === model.id)) return current.filter((item) => item.id !== model.id)
      if (current.length >= 3) return [...current.slice(1), model]
      return [...current, model]
    })
  }

  const benchmarkCount = catalog?.models.filter((model) => model.benchmarks?.length).length ?? 0
  const maxContext = catalog?.models.reduce((maximum, model) => Math.max(maximum, model.contextWindowTokens ?? 0), 0) ?? 0

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#top" className="wordmark" aria-label="Awba home"><LogoMark />AWBA</a>
        <nav><a className={page === 'models' ? 'active' : ''} href="#catalog">Models</a><a className={page === 'schema' ? 'active' : ''} href="#schema">Data model</a><a href={catalogApiUrl}>API</a></nav>
        <div className="topbar-actions">
          <div className="live-state"><i className={sourceMode === 'live' ? '' : 'sample'} />{sourceMode === 'live' ? 'LIVE API' : 'SAMPLE DATA'}</div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
        </div>
      </header>

      {page === 'schema' ? <SchemaExplorer /> : <main id="top">
        <section className="hero-section">
          <div className="hero-grid" />
          <div className="hero-content">
            <div className="eyebrow"><i /> DEVELOPER INTELLIGENCE / POC 01</div>
            <h1>One index for the<br /><em>AI model stack.</em></h1>
            <p>Explore models, publishers, prices, context windows, capabilities, and benchmark coverage through one normalized developer interface.</p>
            <a className="hero-cta" href="#catalog">Explore model data <span>↓</span></a>
          </div>
          <div className="scene-wrap"><ThreeScene theme={theme} /></div>
          <div className="hero-metrics">
            <div><strong>{catalog?.models.length ?? '—'}</strong><span>MODELS LOADED</span></div>
            <div><strong>{publishers.length || '—'}</strong><span>PUBLISHERS</span></div>
            <div><strong>{benchmarkCount || '—'}</strong><span>WITH BENCHMARKS</span></div>
            <div><strong>{formatTokens(maxContext)}</strong><span>MAX CONTEXT</span></div>
          </div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-title">
            <div><span>01</span><h2>Model catalog</h2></div>
            <p>Normalized from live source data. Missing values remain visible instead of being inferred.</p>
          </div>

          <div className="filter-panel">
            <label className="search-input"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search model, publisher, or source ID" /></label>
            <label><span>Publisher</span><select value={publisher} onChange={(event) => setPublisher(event.target.value)}><option value="all">All publishers</option>{publishers.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.count})</option>)}</select></label>
            <label><span>Modality</span><select value={modality} onChange={(event) => setModality(event.target.value)}><option value="all">All modalities</option><option value="text">Text</option><option value="image">Image</option><option value="audio">Audio</option><option value="video">Video</option><option value="file">File</option></select></label>
            <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="intelligence">Intelligence</option><option value="price">Input price</option><option value="context">Context</option><option value="name">Name</option></select></label>
          </div>

          <div className="catalog-meta" id="data">
            <span>{models.length} matching records</span>
            <span>{catalog ? `${catalog.source?.name ?? 'Source'} · updated ${relativeTime(catalog.retrievedAt)}` : 'Loading source data'}</span>
          </div>

          <div className="model-list-head"><span /><span>Model</span><span>Price / MTok</span><span>Context</span><span>Modalities</span><span>Benchmarks</span><span /></div>
          <div className="model-list">
            {!catalog && !loadError && Array.from({ length: 8 }, (_, index) => <div className="row-skeleton" key={index} />)}
            {loadError && <div className="error-box"><strong>Catalog unavailable</strong><span>{loadError}</span></div>}
            {models.slice(0, limit).map((model) => <ModelRow key={model.id} model={model} selected={selected.some((item) => item.id === model.id)} onSelect={toggleSelected} onOpen={setDetail} />)}
          </div>

          {limit < models.length && <button className="load-button" onClick={() => setLimit((value) => value + 30)}>Load 30 more <span>↓</span></button>}
        </section>
      </main>}

      <footer><a className="wordmark" href="#top" aria-label="Awba home"><LogoMark />AWBA</a><p>Evidence before assumptions. Every value keeps its source.</p><a href="https://openrouter.ai/models" target="_blank" rel="noreferrer">Source catalog ↗</a></footer>

      {selected.length > 0 && <div className="compare-tray"><span>{selected.length}/3 selected</span><div>{selected.map((model) => <button onClick={() => toggleSelected(model)} key={model.id}>{model.name} ×</button>)}</div><button className="compare-button" disabled={selected.length < 2} onClick={() => setComparing(true)}>Compare models</button></div>}
      <DetailPanel model={detail} onClose={() => setDetail(null)} onCompare={toggleSelected} selected={detail ? selected.some((item) => item.id === detail.id) : false} />
      {comparing && <ComparePanel models={selected} onClose={() => setComparing(false)} onRemove={toggleSelected} />}
    </div>
  )
}

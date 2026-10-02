import { useEffect, useMemo, useState } from 'react'
import LogoMark from './components/LogoMark'
import ThreeScene from './components/ThreeScene'
import { loadCatalog } from './api/catalog'

const FALLBACK_URL = '/catalog.sample.json'

function initialTheme() {
  const saved = window.localStorage.getItem('awba-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function parseRoute() {
  const path = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  if (!path || path === 'top' || path === 'latest') return { page: 'latest' }
  if (path === 'models' || path === 'catalog') return { page: 'models' }
  if (path === 'providers') return { page: 'providers' }
  if (path.startsWith('providers/')) return { page: 'provider', id: decodeURIComponent(path.slice(10)) }
  if (path === 'compare') return { page: 'compare' }
  return { page: 'latest' }
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

function servingRoute(model) {
  return model.servingRoutes?.[0] ?? { pricing: {} }
}

function dateLabel(value) {
  if (!value) return 'Date unavailable'
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

const modelDate = (model) => new Date(model.releasedAt ?? 0).getTime()
const modelModalities = (model) => [...(model.architecture?.inputModalities ?? []), ...(model.architecture?.outputModalities ?? [])]
  .filter((item, index, all) => all.indexOf(item) === index)
const publisherInitials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

function Score({ label, value }) {
  return <div className="score-cell" title={`${label}: ${value ?? 'not available'}`}><span>{label.slice(0, 3).toUpperCase()}</span><div className="score-bar"><i style={{ width: `${Math.min(value ?? 0, 100)}%` }} /></div><strong>{value == null ? '—' : value.toFixed(1)}</strong></div>
}

function PublisherAvatar({ publisher, large = false }) {
  return <span className={`publisher-avatar${large ? ' large' : ''}`} data-publisher={publisher.id}>{publisherInitials(publisher.name)}</span>
}

function ModelRow({ model, selected, onSelect, onOpen, showPublisher = true }) {
  const pricing = servingRoute(model).pricing ?? {}
  return (
    <article className="model-row">
      <label className="compare-check" title="Add to comparison"><input aria-label={`Compare ${model.name}`} type="checkbox" checked={selected} onChange={() => onSelect(model)} /><span /></label>
      <button className="model-identity" onClick={() => onOpen(model)}><PublisherAvatar publisher={model.publisher} /><span><strong>{model.name}</strong><small>{showPublisher ? `${model.publisher.name} · ` : ''}{dateLabel(model.releasedAt)}</small></span></button>
      <div className="model-numbers price-pair"><span><small>INPUT</small>{formatMoney(pricing.inputPerMillion)}</span><span><small>OUTPUT</small>{formatMoney(pricing.outputPerMillion)}</span></div>
      <div className="model-numbers context-value"><strong>{formatTokens(model.contextWindowTokens)}</strong><small>{formatTokens(model.maxOutputTokens)} output</small></div>
      <div className="modality-list">{modelModalities(model).slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
      <div className="row-scores"><Score label="Intelligence" value={benchmark(model, 'intelligence')} /><Score label="Coding" value={benchmark(model, 'coding')} /><Score label="Agentic" value={benchmark(model, 'agentic')} /></div>
      <button className="row-arrow" onClick={() => onOpen(model)} aria-label={`Open ${model.name}`}>↗</button>
    </article>
  )
}

function ModelList({ models, selected, onSelect, onOpen, limit, showPublisher = true }) {
  return <><div className="model-list-head"><span /><span>Model</span><span>Price / MTok</span><span>Context</span><span>Modalities</span><span>Benchmarks</span><span /></div><div className="model-list">{models.slice(0, limit).map((model) => <ModelRow key={model.id} model={model} selected={selected.some((item) => item.id === model.id)} onSelect={onSelect} onOpen={onOpen} showPublisher={showPublisher} />)}{!models.length && <div className="empty-state"><strong>No models found</strong><span>Try changing the search or filters.</span></div>}</div></>
}

function DetailPanel({ model, onClose, onCompare, selected, onProvider }) {
  useEffect(() => {
    if (!model) return undefined
    const handleKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [model, onClose])
  if (!model) return null
  const route = servingRoute(model)
  const pricing = route.pricing ?? {}
  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-panel" aria-label={`${model.name} details`}>
        <div className="drawer-header"><div><span className="kicker">MODEL PROFILE</span><h2>{model.name}</h2><button className="publisher-link" onClick={() => onProvider(model.publisher.id)}>{model.publisher.name} ↗</button></div><button onClick={onClose} aria-label="Close details">×</button></div>
        <p className="detail-description">{model.description || 'No description was supplied by the source.'}</p>
        <div className="detail-actions"><button className={selected ? 'secondary active' : 'secondary'} onClick={() => onCompare(model)}>{selected ? 'Remove from comparison' : 'Add to comparison'}</button><a href={model.source.url} target="_blank" rel="noreferrer">View source ↗</a></div>
        <section className="detail-section"><h3>At a glance</h3><div className="metric-grid"><div><span>Input / MTok</span><strong>{formatMoney(pricing.inputPerMillion)}</strong></div><div><span>Output / MTok</span><strong>{formatMoney(pricing.outputPerMillion)}</strong></div><div><span>Context window</span><strong>{formatTokens(model.contextWindowTokens)}</strong></div><div><span>Max output</span><strong>{formatTokens(model.maxOutputTokens)}</strong></div></div></section>
        <section className="detail-section"><h3>Capabilities</h3><div className="tag-cloud">{modelModalities(model).map((item) => <span key={item}>{item}</span>)}</div><dl><div><dt>Architecture</dt><dd>{model.architecture?.modality ?? 'Not supplied'}</dd></div><div><dt>Tokenizer</dt><dd>{model.architecture?.tokenizer ?? 'Not supplied'}</dd></div><div><dt>Availability</dt><dd>{model.status}</dd></div></dl></section>
        <section className="detail-section"><h3>Benchmarks</h3>{model.benchmarks?.length ? model.benchmarks.map((item) => <div className="benchmark-line" key={item.key}><span><strong>{item.name}</strong><small>{item.source.name}</small></span><b>{item.score.toFixed(1)}</b></div>) : <p className="empty-copy">No normalized benchmark result is available for this model yet.</p>}</section>
        <section className="detail-section"><h3>Supported parameters</h3><div className="tag-cloud">{model.supportedParameters?.map((parameter) => <span key={parameter}>{parameter}</span>)}</div></section>
        <section className="detail-section"><h3>Source & identity</h3><dl><div><dt>Source ID</dt><dd>{model.sourceId}</dd></div><div><dt>Canonical slug</dt><dd>{model.canonicalSlug}</dd></div><div><dt>Observed release</dt><dd>{dateLabel(model.releasedAt)}</dd></div><div><dt>Pricing route</dt><dd>{route.aggregator?.name ?? 'Not supplied'}</dd></div></dl><p className="data-note">Release and pricing values reflect the connected catalog source. Awba does not infer missing fields.</p></section>
      </aside>
    </div>
  )
}

function ComparisonTable({ models, onRemove }) {
  const attributes = [
    ['Provider', (model) => model.publisher.name], ['Context', (model) => formatTokens(model.contextWindowTokens)], ['Max output', (model) => formatTokens(model.maxOutputTokens)],
    ['Input / MTok', (model) => formatMoney(servingRoute(model).pricing?.inputPerMillion)], ['Output / MTok', (model) => formatMoney(servingRoute(model).pricing?.outputPerMillion)],
    ['Intelligence', (model) => benchmark(model, 'intelligence')?.toFixed(1) ?? '—'], ['Coding', (model) => benchmark(model, 'coding')?.toFixed(1) ?? '—'], ['Agentic', (model) => benchmark(model, 'agentic')?.toFixed(1) ?? '—'],
    ['Observed release', (model) => dateLabel(model.releasedAt)],
  ]
  return <div className="comparison-scroll"><div className="comparison-table" style={{ '--model-count': models.length }}><div className="comparison-heading"><span>Attribute</span></div>{models.map((model) => <div className="comparison-heading" key={model.id}><strong>{model.name}</strong><small>{model.publisher.name}</small><button onClick={() => onRemove(model)}>Remove</button></div>)}{attributes.flatMap(([label, getter]) => [<div className="comparison-label" key={`${label}-label`}>{label}</div>, ...models.map((model) => <div className="comparison-value" key={`${label}-${model.id}`}>{getter(model)}</div>)])}</div></div>
}

function PageIntro({ eyebrow, title, copy, children }) {
  return <div className="page-intro"><div><span className="page-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{children}</div>
}

function LatestPage({ catalog, publishers, selected, onSelect, onOpen, theme }) {
  const latest = publishers.slice().sort((a, b) => modelDate(b.latest) - modelDate(a.latest))
  const recentModels = [...catalog.models].sort((a, b) => modelDate(b) - modelDate(a)).slice(0, 12)
  return <main>
    <section className="product-hero"><div className="hero-grid" /><div className="hero-copy"><div className="eyebrow"><i /> LIVE MODEL INTELLIGENCE</div><h1>Know what’s new<br /><em>across AI.</em></h1><p>Track the latest models from every provider, compare pricing and capabilities, and choose with confidence.</p><div className="hero-actions"><a className="primary-action" href="#/models">Explore all models <span>→</span></a><a className="text-action" href="#/providers">Browse providers</a></div></div><div className="scene-wrap"><ThreeScene theme={theme} /></div><div className="hero-metrics"><div><strong>{catalog.models.length}</strong><span>TRACKED MODELS</span></div><div><strong>{publishers.length}</strong><span>PROVIDERS</span></div><div><strong>{catalog.models.filter((model) => model.benchmarks?.length).length}</strong><span>BENCHMARKED</span></div></div></section>
    <section className="content-section latest-section"><div className="section-heading"><div><span>01</span><h2>Latest by provider</h2></div><a href="#/providers">View all providers →</a></div><p className="section-copy">The newest model observed for each provider in our connected catalog.</p><div className="latest-grid">{latest.slice(0, 8).map((provider) => { const pricing = servingRoute(provider.latest).pricing ?? {}; return <article className="latest-card" key={provider.id}><div className="provider-card-head"><PublisherAvatar publisher={provider} /><a href={`#/providers/${encodeURIComponent(provider.id)}`}>{provider.name} <span>↗</span></a></div><button className="latest-model-button" onClick={() => onOpen(provider.latest)}><strong>{provider.latest.name}</strong><span>{dateLabel(provider.latest.releasedAt)}</span></button><div className="latest-card-metrics"><span><small>INPUT / MTOK</small>{formatMoney(pricing.inputPerMillion)}</span><span><small>CONTEXT</small>{formatTokens(provider.latest.contextWindowTokens)}</span></div></article> })}</div></section>
    <section className="content-section recent-section"><div className="section-heading"><div><span>02</span><h2>Recently observed</h2></div><a href="#/models">Full model catalog →</a></div><p className="section-copy">Recent catalog additions across all providers. Dates are source-reported where available.</p><ModelList models={recentModels} selected={selected} onSelect={onSelect} onOpen={onOpen} limit={12} /></section>
  </main>
}

function ModelsPage({ catalog, publishers, selected, onSelect, onOpen }) {
  const [query, setQuery] = useState('')
  const [publisher, setPublisher] = useState('all')
  const [modality, setModality] = useState('all')
  const [sort, setSort] = useState('newest')
  const [limit, setLimit] = useState(30)
  const models = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...catalog.models].filter((model) => (!needle || `${model.name} ${model.publisher.name} ${model.sourceId}`.toLowerCase().includes(needle)) && (publisher === 'all' || model.publisher.id === publisher) && (modality === 'all' || modelModalities(model).includes(modality))).sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'context') return b.contextWindowTokens - a.contextWindowTokens
      if (sort === 'price') return (servingRoute(a).pricing?.inputPerMillion ?? Infinity) - (servingRoute(b).pricing?.inputPerMillion ?? Infinity)
      if (sort === 'intelligence') return (benchmark(b, 'intelligence') ?? -1) - (benchmark(a, 'intelligence') ?? -1)
      return modelDate(b) - modelDate(a)
    })
  }, [catalog, modality, publisher, query, sort])
  useEffect(() => setLimit(30), [modality, publisher, query, sort])
  return <main className="page-main"><PageIntro eyebrow="MODEL CATALOG" title="Explore every model" copy="Search and compare normalized pricing, context windows, modalities, and benchmark coverage."><div className="intro-stat"><strong>{catalog.models.length}</strong><span>models tracked</span></div></PageIntro><section className="content-section catalog-content"><div className="filter-panel"><label className="search-input"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search model, provider, or source ID" /></label><label><span>Provider</span><select value={publisher} onChange={(event) => setPublisher(event.target.value)}><option value="all">All providers</option>{publishers.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.count})</option>)}</select></label><label><span>Modality</span><select value={modality} onChange={(event) => setModality(event.target.value)}><option value="all">All modalities</option><option value="text">Text</option><option value="image">Image</option><option value="audio">Audio</option><option value="video">Video</option><option value="file">File</option></select></label><label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest observed</option><option value="intelligence">Intelligence</option><option value="price">Input price</option><option value="context">Context</option><option value="name">Name</option></select></label></div><div className="catalog-meta"><span>{models.length} matching models</span><span>Choose up to 3 to compare</span></div><ModelList models={models} selected={selected} onSelect={onSelect} onOpen={onOpen} limit={limit} />{limit < models.length && <button className="load-button" onClick={() => setLimit((value) => value + 30)}>Load 30 more <span>↓</span></button>}</section></main>
}

function ProvidersPage({ publishers }) {
  const [query, setQuery] = useState('')
  const visible = publishers.filter((provider) => provider.name.toLowerCase().includes(query.trim().toLowerCase()))
  return <main className="page-main"><PageIntro eyebrow="PROVIDER DIRECTORY" title="Models, by provider" copy="See what each AI provider offers, their newest observed model, and the depth of their catalog."><div className="intro-stat"><strong>{publishers.length}</strong><span>providers indexed</span></div></PageIntro><section className="content-section provider-content"><label className="directory-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a provider" /></label><div className="provider-directory-meta"><span>{visible.length} providers</span><span>Sorted by catalog size</span></div><div className="provider-grid">{visible.map((provider) => <a className="provider-card" href={`#/providers/${encodeURIComponent(provider.id)}`} key={provider.id}><div><PublisherAvatar publisher={provider} large /><span className="provider-arrow">↗</span></div><h2>{provider.name}</h2><p>{provider.latest.name}</p><div className="provider-card-foot"><span>{provider.count} {provider.count === 1 ? 'model' : 'models'}</span><span>Latest · {dateLabel(provider.latest.releasedAt)}</span></div></a>)}</div></section></main>
}

function ProviderPage({ provider, selected, onSelect, onOpen }) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(30)
  if (!provider) return <main className="page-main"><div className="not-found"><h1>Provider not found</h1><a href="#/providers">Back to providers</a></div></main>
  const models = provider.models.filter((model) => `${model.name} ${model.sourceId}`.toLowerCase().includes(query.trim().toLowerCase()))
  const priced = provider.models.filter((model) => servingRoute(model).pricing?.inputPerMillion != null).length
  const benchmarked = provider.models.filter((model) => model.benchmarks?.length).length
  return <main className="page-main"><section className="provider-hero"><a className="back-link" href="#/providers">← All providers</a><div className="provider-title"><PublisherAvatar publisher={provider} large /><div><span>MODEL PROVIDER</span><h1>{provider.name}</h1><p>{provider.count} models currently tracked</p></div></div><div className="provider-stats"><div><strong>{provider.count}</strong><span>MODELS</span></div><div><strong>{priced}</strong><span>WITH PRICING</span></div><div><strong>{benchmarked}</strong><span>BENCHMARKED</span></div></div></section><section className="content-section provider-detail-content"><div className="latest-spotlight"><div><span className="page-eyebrow">LATEST OBSERVED MODEL</span><h2>{provider.latest.name}</h2><p>{provider.latest.description || 'No source description is available.'}</p></div><div className="spotlight-stats"><span><small>OBSERVED RELEASE</small>{dateLabel(provider.latest.releasedAt)}</span><span><small>CONTEXT</small>{formatTokens(provider.latest.contextWindowTokens)}</span><span><small>INPUT / MTOK</small>{formatMoney(servingRoute(provider.latest).pricing?.inputPerMillion)}</span><button onClick={() => onOpen(provider.latest)}>View model →</button></div></div><div className="provider-model-heading"><div><h2>All {provider.name} models</h2><p>Newest observed first</p></div><label className="directory-search compact"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${provider.name}`} /></label></div><div className="catalog-meta"><span>{models.length} matching models</span><span>Choose up to 3 to compare</span></div><ModelList models={models} selected={selected} onSelect={onSelect} onOpen={onOpen} limit={limit} showPublisher={false} />{limit < models.length && <button className="load-button" onClick={() => setLimit((value) => value + 30)}>Load 30 more <span>↓</span></button>}</section></main>
}

function ComparePage({ models, allModels, onToggle, onOpen }) {
  const [query, setQuery] = useState('')
  const candidates = query.trim() ? allModels.filter((model) => `${model.name} ${model.publisher.name}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8) : []
  return <main className="page-main"><PageIntro eyebrow="MODEL COMPARISON" title="Compare what matters" copy="Put up to three models side by side across price, context, benchmarks, and release information."><div className="intro-stat"><strong>{models.length}/3</strong><span>models selected</span></div></PageIntro><section className="content-section compare-content"><div className="compare-picker"><label className="directory-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for a model to add" /></label>{candidates.length > 0 && <div className="candidate-list">{candidates.map((model) => <button key={model.id} disabled={models.length >= 3 && !models.some((item) => item.id === model.id)} onClick={() => { onToggle(model); setQuery('') }}><PublisherAvatar publisher={model.publisher} /><span><strong>{model.name}</strong><small>{model.publisher.name}</small></span><b>{models.some((item) => item.id === model.id) ? 'Remove' : 'Add +'}</b></button>)}</div>}</div>{models.length >= 2 ? <ComparisonTable models={models} onRemove={onToggle} /> : <div className="compare-empty"><div className="compare-venn"><i /><i /><span>{models.length}</span></div><h2>Select at least two models</h2><p>Search above or add models from anywhere in the catalog.</p><a href="#/models">Browse all models →</a></div>}{models.length === 1 && <div className="selected-preview"><span>Selected</span><button onClick={() => onOpen(models[0])}>{models[0].name} · {models[0].publisher.name} ↗</button></div>}</section></main>
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme)
  const [route, setRoute] = useState(parseRoute)
  const [catalog, setCatalog] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [sourceMode, setSourceMode] = useState('live')
  const [detail, setDetail] = useState(null)
  const [selected, setSelected] = useState([])

  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080a0d' : '#f4f6f1'); window.localStorage.setItem('awba-theme', theme) }, [theme])
  useEffect(() => { const onHashChange = () => { setRoute(parseRoute()); setDetail(null); window.scrollTo(0, 0) }; window.addEventListener('hashchange', onHashChange); return () => window.removeEventListener('hashchange', onHashChange) }, [])
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try { setCatalog(await loadCatalog(controller.signal)) } catch (error) {
        if (error.name === 'AbortError') return
        try { const response = await fetch(FALLBACK_URL, { signal: controller.signal }); if (!response.ok) throw new Error('sample unavailable'); setCatalog(await response.json()); setSourceMode('sample') }
        catch (fallbackError) { if (fallbackError.name !== 'AbortError') setLoadError('Neither the Awba API nor the sample catalog could be loaded.') }
      }
    }
    load(); return () => controller.abort()
  }, [])

  const publishers = useMemo(() => {
    const records = new Map()
    for (const model of catalog?.models ?? []) { const current = records.get(model.publisher.id) ?? { ...model.publisher, count: 0, models: [], latest: model }; current.count++; current.models.push(model); if (modelDate(model) > modelDate(current.latest)) current.latest = model; records.set(model.publisher.id, current) }
    return [...records.values()].map((provider) => ({ ...provider, models: provider.models.sort((a, b) => modelDate(b) - modelDate(a)) })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [catalog])

  function toggleSelected(model) { setSelected((current) => current.some((item) => item.id === model.id) ? current.filter((item) => item.id !== model.id) : current.length >= 3 ? current : [...current, model]) }
  function openProvider(id) { setDetail(null); window.location.hash = `/providers/${encodeURIComponent(id)}` }
  const currentProvider = route.page === 'provider' ? publishers.find((item) => item.id === route.id) : null

  return <div className="app-shell">
    <header className="topbar"><a href="#/latest" className="wordmark" aria-label="Awba home"><LogoMark />AWBA</a><nav aria-label="Main navigation"><a className={route.page === 'latest' ? 'active' : ''} href="#/latest">Latest</a><a className={route.page === 'models' ? 'active' : ''} href="#/models">Models</a><a className={route.page === 'providers' || route.page === 'provider' ? 'active' : ''} href="#/providers">Providers</a><a className={route.page === 'compare' ? 'active' : ''} href="#/compare">Compare{selected.length ? ` (${selected.length})` : ''}</a></nav><div className="topbar-actions"><div className="live-state"><i className={sourceMode === 'live' ? '' : 'sample'} />{sourceMode === 'live' ? 'LIVE' : 'SAMPLE'}</div><button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</button></div></header>
    {!catalog && !loadError && <main className="loading-page"><LogoMark /><span>Loading the model index</span><i /></main>}
    {loadError && <main className="loading-page"><div className="error-box"><strong>Catalog unavailable</strong><span>{loadError}</span></div></main>}
    {catalog && route.page === 'latest' && <LatestPage catalog={catalog} publishers={publishers} selected={selected} onSelect={toggleSelected} onOpen={setDetail} theme={theme} />}
    {catalog && route.page === 'models' && <ModelsPage catalog={catalog} publishers={publishers} selected={selected} onSelect={toggleSelected} onOpen={setDetail} />}
    {catalog && route.page === 'providers' && <ProvidersPage publishers={publishers} />}
    {catalog && route.page === 'provider' && <ProviderPage provider={currentProvider} selected={selected} onSelect={toggleSelected} onOpen={setDetail} />}
    {catalog && route.page === 'compare' && <ComparePage models={selected} allModels={catalog.models} onToggle={toggleSelected} onOpen={setDetail} />}
    <footer><a className="wordmark" href="#/latest" aria-label="Awba home"><LogoMark />AWBA</a><p>AI model intelligence for developers.</p><span>{catalog ? `${catalog.source?.name ?? 'Catalog'} · updated ${relativeTime(catalog.retrievedAt)}` : 'Connecting to catalog'}</span></footer>
    {selected.length > 0 && route.page !== 'compare' && <div className="compare-tray"><span>{selected.length}/3 selected</span><div>{selected.map((model) => <button onClick={() => toggleSelected(model)} key={model.id}>{model.name} ×</button>)}</div><a className={selected.length < 2 ? 'compare-button disabled' : 'compare-button'} href={selected.length < 2 ? undefined : '#/compare'}>Compare models</a></div>}
    <DetailPanel model={detail} onClose={() => setDetail(null)} onCompare={toggleSelected} selected={detail ? selected.some((item) => item.id === detail.id) : false} onProvider={openProvider} />
  </div>
}

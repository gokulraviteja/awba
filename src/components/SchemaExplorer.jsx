import { useMemo, useState } from 'react'
import { schemaDomains, schemaEntities } from '../data/schemaCatalog'
import SourceMapping from './SourceMapping'

const sourceClass = (source) => {
  const value = source.toLowerCase()
  if (value.includes('openrouter') || value.includes('upstream') || value.includes('benchmark source')) return 'external'
  if (value.includes('review') || value.includes('official')) return 'reviewed'
  if (value.includes('derived') || value.includes('normalization') || value.includes('resolution')) return 'derived'
  return 'internal'
}

export default function SchemaExplorer() {
  const [view, setView] = useState('entities')
  const [domain, setDomain] = useState('catalog')
  const [selectedId, setSelectedId] = useState('publishers')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return schemaEntities.filter((entity) => entity.domain === domain && (!needle || `${entity.name} ${entity.table} ${entity.purpose}`.toLowerCase().includes(needle)))
  }, [domain, query])

  const selected = schemaEntities.find((entity) => entity.id === selectedId) ?? visible[0] ?? schemaEntities[0]

  function chooseDomain(nextDomain) {
    setDomain(nextDomain)
    const first = schemaEntities.find((entity) => entity.domain === nextDomain)
    if (first) setSelectedId(first.id)
  }

  const domainInfo = schemaDomains.find((item) => item.id === selected.domain)

  return (
    <main className="schema-page" id="schema">
      <section className="schema-intro">
        <div>
          <span className="eyebrow"><i /> SYSTEM DESIGN / LLD 01</span>
          <h1>Awba data model</h1>
          <p>Inspect one entity at a time: ownership, every database column, nullability, source lineage, transformations, relationships, and known gaps.</p>
        </div>
        <div className="schema-stats">
          <div><strong>14</strong><span>entities</span></div>
          <div><strong>3</strong><span>domains</span></div>
          <div><strong>POC</strong><span>schema status</span></div>
        </div>
      </section>

      <div className="schema-warning">
        <strong>Implementation boundary</strong>
        <span>The API now supports a PostgreSQL snapshot archive and indexed read projection. These 14 domain entities remain the next normalized write-model evolution.</span>
      </div>

      <nav className="schema-view-tabs" aria-label="Data model views">
        <button className={view === 'entities' ? 'active' : ''} onClick={() => setView('entities')}><span>Entity explorer</span><small>Tables, columns, examples</small></button>
        <button className={view === 'mapping' ? 'active' : ''} onClick={() => setView('mapping')}><span>Source API mapping</span><small>Request, response, transformations</small></button>
      </nav>

      {view === 'mapping' ? <SourceMapping /> : <><nav className="domain-tabs" aria-label="Schema domains">
        {schemaDomains.map((item) => (
          <button key={item.id} className={domain === item.id ? 'active' : ''} onClick={() => chooseDomain(item.id)}>
            <span>{item.name}</span><small>{schemaEntities.filter((entity) => entity.domain === item.id).length} entities</small>
          </button>
        ))}
      </nav>

      <div className="schema-workbench">
        <aside className="entity-sidebar">
          <label className="entity-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an entity" /></label>
          <p>{schemaDomains.find((item) => item.id === domain)?.description}</p>
          <div className="entity-list">
            {visible.map((entity, index) => (
              <button key={entity.id} className={selected.id === entity.id ? 'active' : ''} onClick={() => setSelectedId(entity.id)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span><strong>{entity.name}</strong><small>{entity.table}</small></span>
                <b>→</b>
              </button>
            ))}
          </div>
        </aside>

        <article className="entity-detail">
          <header className="entity-header">
            <div><span>{domainInfo?.name} domain</span><h2>{selected.name}</h2><code>{selected.table}</code></div>
            <em>{selected.status}</em>
          </header>
          <p className="entity-purpose">{selected.purpose}</p>

          <section className="entity-block">
            <div className="block-title"><span>01</span><h3>Column contract</h3><b>{selected.fields.length} fields</b></div>
            <div className="field-table-wrap">
              <table className="field-table">
                <thead><tr><th>Column</th><th>Type</th><th>Required</th><th>Source</th><th>Example value</th><th>Meaning / transformation</th></tr></thead>
                <tbody>
                  {selected.fields.map((field) => (
                    <tr key={field.name}>
                      <td><code>{field.name}</code></td>
                      <td><code>{field.type}</code></td>
                      <td><span className={field.required ? 'required' : 'nullable'}>{field.required ? 'Required' : 'Nullable'}</span></td>
                      <td><span className={`source-tag ${sourceClass(field.source)}`}>{field.source}</span></td>
                      <td className="field-example"><code>{field.example.value}</code><small>{field.example.kind}</small></td>
                      <td>{field.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="entity-notes">
            <section className="entity-block">
              <div className="block-title"><span>02</span><h3>Relationships</h3></div>
              <ul>{selected.relationships.map((relationship) => <li key={relationship}>{relationship}</li>)}</ul>
            </section>
            <section className="entity-block current-state">
              <div className="block-title"><span>03</span><h3>What exists today</h3></div>
              <p>{selected.today}</p>
            </section>
            <section className="entity-block known-gap">
              <div className="block-title"><span>04</span><h3>Design gap</h3></div>
              <p>{selected.gap}</p>
            </section>
          </div>

          <div className="source-legend">
            <span><i className="external" />External source</span>
            <span><i className="reviewed" />Reviewed metadata</span>
            <span><i className="derived" />Derived / normalized</span>
            <span><i className="internal" />Awba / database</span>
          </div>
        </article>
      </div></>}
    </main>
  )
}

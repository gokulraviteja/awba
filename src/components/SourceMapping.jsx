import { openRouterCall, openRouterMappings } from '../data/sourceMapping'

function CodeBlock({ children }) {
  return <pre className="lineage-code"><code>{children}</code></pre>
}

export default function SourceMapping() {
  return (
    <div className="lineage-view">
      <section className="namespace-explainer">
        <div className="block-title"><span>01</span><h3>Namespace is not publisher identity</h3></div>
        <div className="namespace-example">
          <code><mark>anthropic</mark>/<b>claude-sonnet-5.5</b></code>
          <div><span><i />Source namespace</span><span><i />Source model key</span></div>
        </div>
        <p><strong>Namespace</strong> is an identifier chosen by one upstream source. It is evidence for publisher matching, not proof. Awba must map it through a reviewed external-identity record before it becomes the canonical publisher. That is why <code>meta</code>, <code>meta-llama</code>, and <code>~openai</code> cannot be merged automatically.</p>
      </section>

      <section className="api-contract">
        <div className="block-title"><span>02</span><h3>External API request</h3><b>Current ingestion adapter</b></div>
        <div className="request-line"><em>{openRouterCall.method}</em><code>{openRouterCall.url}</code></div>
        <div className="contract-grid">
          <div>
            <h4>Query parameters</h4>
            <p>{openRouterCall.queryParameters.length ? openRouterCall.queryParameters.join(', ') : 'None'}</p>
          </div>
          <div>
            <h4>Request body</h4>
            <p>{openRouterCall.requestBody ?? 'None — this is a GET request'}</p>
          </div>
        </div>
        <h4>Headers</h4>
        <table className="header-table"><tbody>{openRouterCall.headers.map((header) => <tr key={header.name}><td><code>{header.name}</code></td><td><code>{header.value}</code></td><td>{header.note}</td></tr>)}</tbody></table>
        <CodeBlock>{`curl -X GET '${openRouterCall.url}' \\\n  -H 'Accept: application/json' \\\n  -H 'User-Agent: awba-poc/0.1'`}</CodeBlock>
      </section>

      <section className="response-contract">
        <div className="block-title"><span>03</span><h3>Real response excerpt</h3><b>Claude Sonnet 5.5 · current snapshot</b></div>
        <CodeBlock>{JSON.stringify(openRouterCall.response, null, 2)}</CodeBlock>
      </section>

      <section className="mapping-contract">
        <div className="block-title"><span>04</span><h3>Source-to-database mapping</h3><b>{openRouterMappings.length} mappings</b></div>
        <div className="mapping-table-wrap">
          <table className="mapping-table">
            <thead><tr><th>Source JSON path</th><th>Raw example</th><th>Normalized Go value</th><th>Production target</th><th>Transformation</th><th>Status</th></tr></thead>
            <tbody>{openRouterMappings.map((mapping, index) => (
              <tr key={`${mapping.source}-${index}`} className={mapping.status === 'Not mapped' ? 'unmapped' : ''}>
                <td><code>{mapping.source}</code></td>
                <td><code>{mapping.rawExample}</code></td>
                <td><code>{mapping.normalized}</code></td>
                <td><code>{mapping.target}</code></td>
                <td>{mapping.transform}</td>
                <td><span className={`mapping-status ${mapping.status.toLowerCase().replaceAll(' ', '-')}`}>{mapping.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

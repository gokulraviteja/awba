import { useEffect, useRef, useState } from 'react'
import LogoMark from './LogoMark'
import { createCourtyard } from './diwaliScene'
import './diwali.css'

export const CRACKERS = [
  { id: 'flower', name: 'Flower pot', type: 'A fountain of gold', color: '#edaf46', duration: 5.5 },
  { id: 'chakra', name: 'Ground chakkar', type: 'A whirling little sun', color: '#ec7960', duration: 5 },
  { id: 'rocket', name: 'Sky rocket', type: 'Up, up & sparkle', color: '#80bbae', duration: 5 },
  { id: 'sparkler', name: 'Sparkler', type: 'A thousand tiny stars', color: '#dbb970', duration: 4.5 },
  { id: 'peony', name: 'Colour burst', type: 'Flowers in the sky', color: '#ac8bcf', duration: 5.5 },
  { id: 'comet', name: 'Golden comet', type: 'A trail of stardust', color: '#e59a60', duration: 5 },
  { id: 'chain', name: 'Cracker garland', type: 'A playful pop-pop-pop', color: '#cf6476', duration: 4.5 },
  { id: 'willow', name: 'Golden willow', type: 'A sky full of wishes', color: '#b7b568', duration: 6 },
]

function CrackerIcon({ id, color }) {
  return <svg viewBox="0 0 80 68" fill="none" aria-hidden="true" style={{ color }}>
    <ellipse cx="40" cy="58" rx="24" ry="4" fill="currentColor" opacity=".12" />
    {id === 'flower' ? <><path d="m24 55 12-31h9l12 31Z" fill="currentColor" /><path d="m29 44 22-7M26 51l28-8" stroke="#fff0d1" strokeWidth="3" /><path d="M40 22V10m-8 12-7-10m23 10 7-10M40 8l2-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></> :
      id === 'chakra' ? <><ellipse cx="40" cy="48" rx="22" ry="9" fill="currentColor" /><ellipse cx="40" cy="45" rx="22" ry="9" fill="#fae6ac" /><path d="M48 45c0-9-24-7-21 0s23 6 25-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="m58 37 6-9m-3 14 10-2M56 30l-1-8" stroke="currentColor" strokeWidth="2" /></> :
      id === 'sparkler' ? <><path d="m28 58 15-30" stroke="#a2a4ae" strokeWidth="3" /><path d="m43 28 4-9m-9 11-8-6m16 9 9 1m-14-8-2-10m9 11 9-6m-13 17 2 8m-12-9-6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><circle cx="43" cy="30" r="5" fill="#f4ce74" /></> :
      id === 'chain' ? <><path d="m25 12 30 43" stroke="#e8bd86" strokeWidth="2" />{[0,1,2,3,4,5].map(i => <g key={i} transform={`translate(${25+i*5} ${15+i*7}) rotate(-35)`}><rect x="-11" y="-4" width="22" height="8" rx="2" fill="currentColor" /><path d="M-7-4v8M7-4v8" stroke="#fbdc9c" strokeWidth="2" /></g>)}</> :
      id === 'rocket' || id === 'comet' ? <><path d="m38 55 8-27" stroke="#dfb98b" strokeWidth="3" /><g transform="rotate(16 43 30)"><path d="m34 25 9-14 9 14" fill="#f4cb79" /><path d="M35 25h16v22H35Z" fill="currentColor" /><path d="m35 31 16 8" stroke="#f4e5bf" strokeWidth="4" /><path d="m35 39-6 10h6m16-10 6 10h-6" fill="currentColor" /></g><path d="m28 18-5-5m33 4 5-5" stroke="currentColor" strokeWidth="2" /></> :
      <><rect x="29" y="41" width="23" height="15" rx="3" fill="currentColor" /><path d="M33 46h15" stroke="#f4e5bf" strokeWidth="2" />{Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9;return <path key={i} d={`M${41+Math.cos(a)*8} ${24+Math.sin(a)*8}l${Math.cos(a)*10} ${Math.sin(a)*10}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />})}<circle cx="41" cy="24" r="3" fill="#f4cb79" /></>}
  </svg>
}

export default function DiwaliPage() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const stageRef = useRef(null)
  const [selected, setSelected] = useState(CRACKERS[0])
  const [phase, setPhase] = useState('idle')
  const [seen, setSeen] = useState([])
  const [sound, setSound] = useState(false)
  const [gentle, setGentle] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [full, setFull] = useState(false)
  const [fullError, setFullError] = useState('')
  const busy = phase !== 'idle' && phase !== 'done'
  useEffect(() => {
    const title = document.title
    document.title = 'A little spark. A sky full of joy. — AWBA Diwali'
    sceneRef.current = createCourtyard(canvasRef.current, next => setPhase(next))
    const fullscreen = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', fullscreen)
    return () => { document.title = title; sceneRef.current?.destroy(); document.removeEventListener('fullscreenchange', fullscreen) }
  }, [])
  useEffect(() => { sceneRef.current?.configure({ sound, gentle }) }, [sound, gentle])
  function light(cracker = selected) {
    if (busy) return
    setSelected(cracker)
    setSeen(prev => prev.includes(cracker.id) ? prev : [...prev, cracker.id])
    sceneRef.current?.play(cracker)
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await stageRef.current.requestFullscreen()
    } catch { setFullError('Full screen is unavailable in this browser.') }
  }
  const messages = { idle: 'The courtyard is yours. Pick a little magic.', approach: 'Here we go! Bringing a little spark…', light: 'One tiny spark…', retreat: 'Quick! Back to our watching spot.', fuse: 'Ready? Look up…', effect: selected.type + '.', done: 'That was lovely. Shall we try another?' }
  const step = ['idle','done'].includes(phase) ? -1 : ['approach','light'].includes(phase) ? 0 : ['retreat','fuse'].includes(phase) ? 1 : 2
  return <div className="diwali-page">
    <header className="dw-header"><a href="/" className="dw-brand" aria-label="AWBA home"><LogoMark /> awba<span> / </span><span className="dw-edition">little celebrations</span></a><span className="dw-header-note"><i /> THE FESTIVAL OF LIGHTS</span><a href="/" className="dw-back">Back to Awba <span>↗</span></a></header>
    <main className="dw-main">
      <section className="dw-intro"><div><p className="dw-eyebrow"><span>✦</span> A LITTLE DIWALI, WHEREVER YOU ARE</p><h1>A little spark.<br /><em>A sky full of joy.</em></h1><p className="dw-description">Pick a cracker. Watch our little friend light it up.<br className="dw-desktop-break" /> Then sit back and let the night work its magic.</p></div><div className="dw-greeting" aria-label="Happy Diwali"><span>शुभ दीपावली</span><svg viewBox="0 0 180 110" aria-hidden="true"><path d="M90 17C72 41 83 53 90 53s19-12 0-36" fill="#eaa747" /><path d="M90 35c-7 10-4 16 0 16s7-6 0-16" fill="#fff1ba" /><path d="M43 64q47 65 94 0Z" fill="#b65e47" /><ellipse cx="90" cy="64" rx="47" ry="11" fill="#db9668" /><ellipse cx="90" cy="64" rx="35" ry="6" fill="#733b37" /><path d="m86 63 4-11" stroke="#f6d291" strokeWidth="3" /><path d="m30 41-7-4m126 6 7-4M90 5V0" stroke="#d3a76b" strokeWidth="2" strokeLinecap="round" /><path d="M63 83q27 23 54 0" stroke="#efc491" strokeWidth="2" fill="none" /></svg><small>Make a little light.</small></div></section>
      <div className="dw-playground">
        <section className="dw-stage-panel" aria-label="Diwali courtyard">
          <div className="dw-stage" ref={stageRef} data-phase={phase}>
            <canvas ref={canvasRef} aria-label={`Animated Diwali courtyard. ${messages[phase]}`} role="img" />
            <div className="dw-stage-top"><span><i /> THE DIWALI COURTYARD</span><div><button onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'} title="Toggle sound">{sound ? '♫' : '♪'}<span>Sound {sound ? 'on' : 'off'}</span></button>{Boolean(document.fullscreenEnabled) && <button onClick={fullscreen} aria-label={full ? 'Exit full screen' : 'Enter full screen'} title="Full screen">⛶</button>}</div></div>
            <div className="dw-scene-caption"><span>{phase === 'effect' ? '✦ ' + selected.name : 'A night made for wonder'}</span><small>{phase === 'effect' ? 'Enjoy your little light show' : 'A little rooftop. A million possibilities.'}</small></div>
          </div>
          <div className="dw-control-bar"><div className="dw-status" role="status" aria-live="polite"><span className={busy ? 'dw-pulse' : ''}>✦</span><p>{messages[phase]}<small>{busy ? 'Your little light show is in progress' : phase === 'done' ? `${selected.name} · Pick another or play it again` : 'Choose from the cracker box to begin'}</small></p></div><button className="dw-light" disabled={busy} onClick={() => light()}>{busy ? 'A little magic…' : phase === 'done' ? '↻ Play again' : 'Light it up ↗'}</button></div>
          {fullError && <p role="status">{fullError}</p>}
          <div className="dw-steps">{['A little spark', 'A quick dash back', 'A moment of wonder'].map((label,i)=><div key={label} className={step===i?'is-current':''}><span>0{i+1}</span>{label}<i /></div>)}</div>
        </section>
        <aside className="dw-box"><div className="dw-box-heading"><div><p className="dw-eyebrow">THE CRACKER BOX</p><h2>Choose your sparkle.</h2></div><span>0{CRACKERS.length}</span></div><p className="dw-box-copy">Eight little ways to light up the night.</p><div className="dw-crackers">{CRACKERS.map(c=><button key={c.id} className={`dw-cracker ${selected.id===c.id?'is-selected':''}`} onClick={()=>light(c)} disabled={busy} aria-pressed={selected.id===c.id} aria-label={`Light ${c.name}`}><span className="dw-card-check">{seen.includes(c.id)?'✓':'↗'}</span><CrackerIcon id={c.id} color={c.color} /><strong>{c.name}</strong><small>{c.type}</small></button>)}</div><div className="dw-collection"><span>{seen.length === 8 ? 'A whole sky of memories ✦' : 'A little collection of happy moments'}</span><strong>{seen.length} / 8</strong></div></aside>
      </div>
      <footer className="dw-footer"><span><b>✦</b> All the wonder. Just pixels.</span><label><input type="checkbox" checked={gentle} onChange={e=>setGentle(e.target.checked)} /> Gentle motion</label><span>Made for the joy of it. <span className="dw-footer-diya">Happy Diwali.</span></span></footer>
    </main>
  </div>
}

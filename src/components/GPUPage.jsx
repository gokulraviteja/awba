import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  anatomy,
  defaultDesign,
  designs,
  gpus,
  makers,
  museumRacks,
} from "./gpuData.js";
import { createGpuScene } from "./gpuScene.js";
import "./gpu.css";
import { GPUAssistant, GPUGuideChat } from "./GPUAssistant.jsx";

const Arrow = ({ direction = "right" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
    style={{ transform: direction === "left" ? "rotate(180deg)" : undefined }}
  >
    <path d="M4 12h15M13 5l7 7-7 7" />
  </svg>
);
function Dialog({ title, kicker, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const trap = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const a = [
          ...ref.current.querySelectorAll(
            'button,a[href],input,select,[tabindex="0"]',
          ),
        ].filter((x) => !x.disabled);
        if (!a.length) return;
        if (e.shiftKey && document.activeElement === a[0]) {
          e.preventDefault();
          a.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === a.at(-1)) {
          e.preventDefault();
          a[0].focus();
        }
      }
    };
    const el = ref.current;
    el.addEventListener("keydown", trap);
    return () => {
      el.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="gpu-dialog-backdrop" onClick={onClose}>
      <section
        className={`gpu-dialog ${wide ? "gpu-dialog-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gpu-dialog-title"
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span className="gpu-mono">{kicker}</span>
            <h2 id="gpu-dialog-title">{title}</h2>
          </div>
          <button
            className="gpu-close"
            aria-label="Close panel"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Catalog({ onSelect, selected, compare, toggleCompare }) {
  const [maker, setMaker] = useState("All"),
    [generation, setGeneration] = useState("All"),
    [query, setQuery] = useState("");
  const generations = [
    ...new Set(
      gpus
        .filter((g) => maker === "All" || g.maker === maker)
        .map((g) => g.generation),
    ),
  ];
  const results = gpus.filter(
    (g) =>
      (maker === "All" || g.maker === maker) &&
      (generation === "All" || g.generation === generation) &&
      `${g.name} ${g.architecture}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <p className="gpu-panel-intro">
        Choose the silicon first. Then explore the cooler, fans and finish
        wrapped around it.
      </p>
      <div className="gpu-filter">
        <div className="gpu-maker-filter">
          {["All", ...Object.keys(makers)].map((m) => (
            <button
              key={m}
              aria-pressed={maker === m}
              onClick={() => {
                setMaker(m);
                setGeneration("All");
              }}
            >
              {m !== "All" && <i style={{ background: makers[m].color }} />}
              {m}
            </button>
          ))}
        </div>
        <div className="gpu-input-row">
          <input
            aria-label="Search GPU models"
            placeholder="Search model or architecture…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="GPU generation"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
          >
            <option value="All">All generations</option>
            {generations.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="gpu-result-count gpu-mono">
        {results.length} MODELS / REFERENCE SPECIFICATIONS
      </div>
      <div className="gpu-model-list">
        {results.map((g) => (
          <article
            key={g.id}
            className={selected.id === g.id ? "is-selected" : ""}
          >
            <button className="gpu-model-pick" onClick={() => onSelect(g)}>
              <span
                className="gpu-model-dot"
                style={{ background: makers[g.maker].color }}
              />
              <span>
                <strong>{g.name}</strong>
                <small>
                  {g.architecture} · {g.generation}
                </small>
              </span>
              <span className="gpu-model-memory">
                {g.vram}
                <small>GB</small>
              </span>
              <Arrow />
            </button>
            <button
              className="gpu-compare-add"
              aria-label={`${compare.includes(g.id) ? "Remove" : "Compare"} ${g.name}`}
              aria-pressed={compare.includes(g.id)}
              disabled={compare.length === 3 && !compare.includes(g.id)}
              onClick={() => toggleCompare(g.id)}
            >
              {compare.includes(g.id) ? "✓" : "+"}
            </button>
          </article>
        ))}
      </div>
      {!results.length && (
        <p className="gpu-no-results">
          No models found. Try another name or generation.
        </p>
      )}
      <p className="gpu-fineprint">
        A curated desktop catalog: RTX 30/40/50, selected Radeon RX
        6000/7000/9000 and Intel Arc A/B. Not every historical, regional, OEM or
        laptop SKU. Partner power limits can differ. No live prices or stock.
      </p>
    </>
  );
}
function Basics() {
  return (
    <div className="gpu-basics">
      <p className="gpu-panel-intro">
        A graphics card is a small computer dedicated to drawing your frames.
        The GPU is the chip on it.
      </p>
      <div className="gpu-basics-pipeline">
        <span>
          CPU<small>prepares work</small>
        </span>
        <Arrow />
        <span>
          GPU<small>renders a frame</small>
        </span>
        <Arrow />
        <span>
          DISPLAY<small>shows the frame</small>
        </span>
      </div>
      <h3>Two names. Two different jobs.</h3>
      {Object.entries(makers).map(([m, d]) => (
        <article key={m}>
          <b style={{ color: d.color }}>
            {m}
            <small>{d.family}</small>
          </b>
          <p>{d.description}</p>
        </article>
      ))}
      <h3>Read a card name.</h3>
      <div className="gpu-name-example">
        <span>
          ASUS<small>board partner</small>
        </span>
        <span>
          ROG Astral<small>cooler family</small>
        </span>
        <span>
          RTX 5090<small>GPU model</small>
        </span>
        <span>
          32GB<small>VRAM capacity</small>
        </span>
        <span>
          OC<small>factory overclock</small>
        </span>
      </div>
      <p>
        “Ti”, “SUPER”, “XT” and “XTX” identify different models within a maker’s
        range. These suffixes are not a universal speed scale. An 8GB and 16GB
        version can share a chip but have different memory capacity.
      </p>
      <h3>What a different provider changes</h3>
      <p>
        Board partners can change the cooler, noise, dimensions, power limit,
        connectors, warranty and clock settings. A premium cooler does not turn
        a 5070 into a 5080. Compare independent reviews of the exact card, then
        check its fit and local India warranty.
      </p>
      <h3>Your CS2 / 360Hz goal</h3>
      <p>
        360Hz means a refresh opportunity every <strong>2.78ms</strong>. It does
        not guarantee 360 FPS. At stretched 4:3 competitive settings, CPU and
        memory performance can become the limit. Measure average FPS, 1% lows
        and frame times on the same map and settings; a GPU model name cannot
        promise a minimum 400 FPS.
      </p>
      <h3>Before you install one</h3>
      <p>
        Check case clearance, slot thickness, PSU capacity and the exact power
        cable. Use the upper full-length PCIe slot recommended by the
        motherboard manual. Plug the monitor into the graphics card’s display
        outputs. Install the appropriate driver.
      </p>
      <a className="gpu-text-link" href="/pc/guide">
        Explore the rest of the PC & assembly guide <Arrow />
      </a>
    </div>
  );
}
export default function GPUPage() {
  const [selected, setSelected] = useState(gpus[0]),
    [design, setDesign] = useState(designs[0]),
    [mode, setMode] = useState("vault"),
    [panel, setPanel] = useState(null),
    [status, setStatus] = useState("loading"),
    [part, setPart] = useState("chip"),
    [photo, setPhoto] = useState(0),
    [depth, setDepth] = useState(0),
    [compare, setCompare] = useState([]),
    [moveOpen, setMoveOpen] = useState(false),
    [welcome, setWelcome] = useState(true),
    [player, setPlayer] = useState({ x: 0, z: 16, yaw: 0 }),
    [hovered, setHovered] = useState(null);
  const [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [spin, setSpin] = useState(
      () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const host = useRef(null),
    scene = useRef(null),
    selectRef = useRef(null);
  const chooseDesign = (d) => {
    const g = gpus.find((g) => g.id === d.gpu);
    setSelected(g);
    setDesign(d);
    setMoveOpen(false);
    setMode("inspect");
    setPanel(null);
    setPhoto(0);
  };
  selectRef.current = (exhibit) => {
    if (exhibit.gpu) {
      setSelected(exhibit.gpu);
      setDesign(exhibit.design);
      setMoveOpen(false);
      setMode("inspect");
      setPanel(null);
      setPhoto(0);
    } else chooseDesign(exhibit);
  };
  useEffect(() => {
    document.title = "PC Museum — Graphics, up close | Awba";
    document.documentElement.dataset.theme = "dark";
    document.body.classList.add("gpu-body");
    const s = createGpuScene(host.current, {
      onSelect: (d) => selectRef.current(d),
      onStatus: setStatus,
      onDepth: setDepth,
      onHover: setHovered,
      onPosition: (p) => {
        setPlayer(p);
        if (
          Math.abs(p.x) > 0.4 ||
          Math.abs(p.z - 16) > 0.4 ||
          Math.abs(p.yaw) > 0.3 ||
          Math.abs(p.pitch - 0.08) > 0.08
        )
          setWelcome(false);
      },
      reducedMotion: reduced,
    });
    scene.current = s;
    return () => {
      s.dispose();
      scene.current = null;
      document.body.classList.remove("gpu-body");
    };
  }, []);
  useEffect(() => {
    scene.current?.update({
      design,
      mode,
      part,
      spin,
      reducedMotion: reduced,
      paused: !!panel,
    });
  }, [design, mode, part, spin, reduced, panel]);
  useEffect(() => {
    const handler = (e) => {
      if (panel || ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName))
        return;
      if (e.key === "Escape") {
        setMode("vault");
        setMoveOpen(false);
        setWelcome(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, panel]);
  const chooseGpu = (g) => {
    setSelected(g);
    setDesign(defaultDesign(g));
    setMoveOpen(false);
    setMode("inspect");
    setPanel(null);
    setPhoto(0);
  };
  const toggleCompare = (id) =>
    setCompare((a) =>
      a.includes(id)
        ? a.filter((x) => x !== id)
        : a.length < 3
          ? [...a, id]
          : a,
    );
  const compared = useMemo(
    () => compare.map((id) => gpus.find((g) => g.id === id)),
    [compare],
  );
  const currentPart = anatomy.find((p) => p.id === part);
  const accent = makers[selected.maker].color;
  const toVault = () => {
    setMode("vault");
    setPanel(null);
  };
  const closePanel = useCallback(() => setPanel(null), []);
  const visitRack = (id) => {
    setMoveOpen(false);
    setMode("vault");
    setPanel(null);
    setWelcome(false);
    scene.current?.navigate(id);
  };
  const walkButton = (direction, label, glyph) => (
    <button
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setWelcome(false);
        scene.current?.move(direction, true);
      }}
      onPointerUp={() => scene.current?.move(direction, false)}
      onPointerCancel={() => scene.current?.move(direction, false)}
      onLostPointerCapture={() => scene.current?.move(direction, false)}
      onClick={(e) => {
        if (e.detail === 0) {
          setWelcome(false);
          scene.current?.step(direction);
        }
      }}
    >
      {glyph}
    </button>
  );
  return (
    <main
      className={`gpu-page gpu-mode-${mode}`}
      style={{ "--gpu-accent": accent }}
      data-player-x={player.x.toFixed(2)}
      data-player-z={player.z.toFixed(2)}
      data-player-yaw={player.yaw.toFixed(2)}
    >
      <div
        className="gpu-scene"
        ref={host}
        data-scene-status={status}
        aria-label="Walkable 3D PC museum"
      />
      <div className="gpu-vignette" />
      <header className="gpu-header">
        <a href="/" className="gpu-brand" aria-label="Awba home">
          <svg
            className="gpu-brand-symbol"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 3h18l3 3v23H6z" stroke="currentColor" strokeWidth="2" />
            <circle
              cx="16"
              cy="13"
              r="5"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="16"
              cy="23"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M23 6h1" stroke="currentColor" strokeWidth="2" />
          </svg>
          awba
          <span className="gpu-header-slash">/</span>
          <span className="gpu-brand-sub">PC MUSEUM</span>
        </a>
        <button
          className="gpu-menu-trigger"
          aria-label="Open menu"
          onClick={() => {
            setMoveOpen(false);
            setPanel("menu");
          }}
        >
          <span>Menu</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 6h14M3 13h14" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </header>

      {mode !== "intro" && mode !== "vault" && (
        <section className="gpu-inspector" aria-live="polite">
          <button className="gpu-back" onClick={toVault}>
            <Arrow direction="left" /> Back to museum
          </button>
          <div className="gpu-kicker gpu-mono" style={{ color: accent }}>
            {selected.maker.toUpperCase()} /{" "}
            {selected.architecture.toUpperCase()}
          </div>
          <h1>{selected.name}</h1>
          <button
            className="gpu-design-name"
            onClick={() => setPanel("designs")}
          >
            {design.brand} {design.name}
            <span>↗</span>
          </button>
          <div className="gpu-view-switch" role="group" aria-label="Card view">
            <button
              aria-pressed={mode !== "inside" && mode !== "photos"}
              onClick={() => setMode("inspect")}
            >
              01 <span>Exterior</span>
            </button>
            <button
              aria-pressed={mode === "inside"}
              onClick={() => setMode("inside")}
            >
              02 <span>Inside</span>
            </button>
            <button
              aria-pressed={mode === "photos"}
              onClick={() => {
                setMode("photos");
                setPhoto(0);
              }}
            >
              03 <span>Real photos</span>
            </button>
          </div>

          <div className="gpu-specs">
            <div>
              <strong>
                {selected.vram}
                <small>GB</small>
              </strong>
              <span>{selected.memory} MEMORY</span>
            </div>
            <div>
              <strong>
                {selected.watts}
                <small>W</small>
              </strong>
              <span>REFERENCE BOARD POWER</span>
            </div>
            <div>
              <strong>
                {selected.bus}
                <small>bit</small>
              </strong>
              <span>MEMORY INTERFACE</span>
            </div>
          </div>
          {mode === "inside" ? (
            <div className="gpu-anatomy-copy">
              <span className="gpu-mono">
                {String(anatomy.findIndex((a) => a.id === part) + 1).padStart(
                  2,
                  "0",
                )}{" "}
                / UNDER THE SHROUD
              </span>
              <h2>{currentPart.title}</h2>
              <b>{currentPart.short}</b>
              <p>{currentPart.text}</p>
            </div>
          ) : (
            <>
              <GPUAssistant
                key={selected.id + design.id}
                gpu={selected}
                design={design}
                onAsk={() => setPanel("guide")}
              />
              <details className="gpu-card-details">
                <summary>About this card design</summary>
                <p className="gpu-design-note">{design.note}</p>
                <p className="gpu-fineprint">
                  Original, simplified 3D study; not manufacturer CAD. See Real
                  photos for manufacturer imagery. Anatomy layers are
                  illustrative.
                </p>
                {design.length && (
                  <span className="gpu-dimensions gpu-mono">
                    {design.length} MM LONG · {design.slots} SLOTS
                  </span>
                )}
                <div className="gpu-inspector-links">
                  <button onClick={() => toggleCompare(selected.id)}>
                    {compare.includes(selected.id)
                      ? "✓ Added to compare"
                      : "+ Add to compare"}
                  </button>
                  <a href={design.url} target="_blank" rel="noreferrer">
                    Official product ↗
                  </a>
                </div>
              </details>
            </>
          )}
        </section>
      )}
      {mode === "vault" && (
        <>
          {welcome && (
            <section className="gpu-museum-title is-welcome">
              <span className="gpu-mono">THE PC MUSEUM</span>
              <h1>
                Graphics,
                <br />
                <span>up close.</span>
              </h1>
              <p>
                Walk through the collection.
                <br />
                Select a card. Your guide will explain it.
              </p>
              <button className="gpu-primary" onClick={() => setWelcome(false)}>
                Start exploring <Arrow />
              </button>
            </section>
          )}

          {hovered && (
            <div className="gpu-exhibit-hint" aria-live="polite">
              <strong>{hovered}</strong>
              <span>Click to inspect ↗</span>
            </div>
          )}
          <button
            className="gpu-move-trigger"
            aria-label={
              moveOpen ? "Hide movement controls" : "Show movement controls"
            }
            aria-expanded={moveOpen}
            onClick={() => {
              setMoveOpen(!moveOpen);
              setWelcome(false);
            }}
          >
            Move <span>↗</span>
          </button>
          {moveOpen && (
            <div className="gpu-walk-controls">
              <button
                className="gpu-move-close"
                aria-label="Close movement controls"
                onClick={() => setMoveOpen(false)}
              >
                ×
              </button>

              <div className="gpu-walk-heading">
                <span className="gpu-mono">WALK</span>
                <span>W A S D</span>
              </div>
              <div className="gpu-walk-pad">
                {walkButton("forward", "Walk forward", "↑")}
                {walkButton("left", "Walk left", "←")}
                {walkButton("back", "Walk backward", "↓")}
                {walkButton("right", "Walk right", "→")}
              </div>
              <div className="gpu-turn-pad">
                {walkButton("turnLeft", "Turn left", "↶")}
                <span>LOOK</span>
                {walkButton("turnRight", "Turn right", "↷")}
              </div>
              <button
                className="gpu-entrance"
                onClick={() => {
                  scene.current?.reset();
                  setWelcome(true);
                }}
              >
                ↺ Back to entrance
              </button>
            </div>
          )}
        </>
      )}
      {mode !== "vault" && (
        <>
          {mode === "photos" && (
            <div className="gpu-photo-view">
              {design.photos.length ? (
                <>
                  <img
                    src={`/gpu/${design.photos[photo]}`}
                    alt={`${design.brand} ${design.name} ${selected.name}, manufacturer product photograph ${photo + 1}`}
                  />
                  <div className="gpu-photo-controls">
                    <button
                      aria-label="Previous product photo"
                      disabled={design.photos.length < 2}
                      onClick={() =>
                        setPhoto(
                          (photo + design.photos.length - 1) %
                            design.photos.length,
                        )
                      }
                    >
                      <Arrow direction="left" />
                    </button>
                    <span className="gpu-mono">
                      {photo + 1} / {design.photos.length}
                    </span>
                    <button
                      aria-label="Next product photo"
                      disabled={design.photos.length < 2}
                      onClick={() =>
                        setPhoto((photo + 1) % design.photos.length)
                      }
                    >
                      <Arrow />
                    </button>
                  </div>
                  <a href={design.url} target="_blank" rel="noreferrer">
                    PHOTOGRAPH © {design.brand.toUpperCase()} · VIEW SOURCE ↗
                  </a>
                </>
              ) : (
                <div className="gpu-photo-empty">
                  <h2>See the actual card.</h2>
                  <p>
                    This model has a representative 3D study. Choose a
                    photographed product from the design archive.
                  </p>
                  <button
                    className="gpu-primary"
                    onClick={() => setPanel("designs")}
                  >
                    Open design archive <Arrow />
                  </button>
                  <a href={design.url} target="_blank" rel="noreferrer">
                    Manufacturer specifications ↗
                  </a>
                </div>
              )}
            </div>
          )}
          {mode === "inside" && (
            <div className="gpu-anatomy-selector" aria-label="GPU anatomy">
              {anatomy.map((a, i) => (
                <button
                  key={a.id}
                  aria-label={`Explore ${a.title}`}
                  aria-pressed={part === a.id}
                  onClick={() => setPart(a.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {a.title}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {status === "fallback" && mode !== "photos" && (
        <div className="gpu-webgl-fallback">
          <span className="gpu-mono">3D UNAVAILABLE ON THIS DEVICE</span>
          <button className="gpu-primary" onClick={() => setMode("photos")}>
            Explore product photos <Arrow />
          </button>
          <p>The full catalog, specifications and learning guide still work.</p>
        </div>
      )}
      {status === "loading" && (
        <div className="gpu-loading gpu-mono">
          OPENING THE MUSEUM <i />
        </div>
      )}
      <div className="gpu-quiet-hint">
        {mode === "vault"
          ? "WASD to walk · drag to look · select a card"
          : "Drag the card to rotate"}
      </div>
      {panel && (
        <Dialog
          key={panel}
          title={
            panel === "menu"
              ? "Explore at your pace."
              : panel === "guide"
                ? `Meet ${selected.name}.`
                : panel === "catalog"
                  ? "Find your silicon."
                  : panel === "designs"
                    ? "Same chip. Different character."
                    : panel === "basics"
                      ? "Start with the small chip."
                      : "Put them side by side."
          }
          kicker={
            panel === "menu"
              ? "THE PC MUSEUM"
              : panel === "guide"
                ? "YOUR MUSEUM GUIDE"
                : panel === "catalog"
                  ? "THE MODEL INDEX"
                  : panel === "designs"
                    ? "THE DESIGN ARCHIVE"
                    : panel === "basics"
                      ? "GRAPHICS CARD / FIELD NOTES"
                      : "COMPARE / UP TO THREE"
          }
          onClose={closePanel}
          wide={panel === "designs" || panel === "compare"}
        >
          {panel === "menu" && (
            <div className="gpu-menu-content">
              <nav className="gpu-menu-links" aria-label="Museum menu">
                <button onClick={() => setPanel("catalog")}>
                  Model index <span>{gpus.length}</span>
                </button>
                <button
                  aria-label="Design archive"
                  onClick={() => setPanel("designs")}
                >
                  Design archive <span>↗</span>
                </button>
                <button
                  aria-label="GPU basics"
                  onClick={() => setPanel("basics")}
                >
                  GPU basics <span>↗</span>
                </button>
                <button
                  aria-label="Open GPU comparison"
                  onClick={() => setPanel("compare")}
                >
                  Compare GPUs <span>{compare.length}</span>
                </button>
                {mode !== "vault" && (
                  <button onClick={toVault}>
                    Return to museum <span>↗</span>
                  </button>
                )}
              </nav>
              <details className="gpu-menu-destinations">
                <summary>Jump to a display bay</summary>
                <div>
                  {museumRacks.map((r) => (
                    <button
                      key={r.id}
                      aria-label={`Visit ${r.maker} ${r.generation} rack`}
                      onClick={() => visitRack(r.id)}
                    >
                      <span>{r.maker}</span>
                      {r.generation}
                    </button>
                  ))}
                </div>
              </details>
              <details className="gpu-menu-help">
                <summary>Movement & help</summary>
                <p>
                  W / S moves forward and back. A / D moves sideways. Drag the
                  room to look around. Arrow keys also work. Select any card to
                  inspect it and meet your guide.
                </p>
                <button
                  onClick={() => {
                    setPanel(null);
                    setMode("vault");
                    setMoveOpen(true);
                    setWelcome(false);
                  }}
                >
                  Show movement controls ↗
                </button>
                <button
                  onClick={() => {
                    setPanel(null);
                    setMode("vault");
                    scene.current?.reset();
                    setWelcome(true);
                  }}
                >
                  Back to entrance ↗
                </button>
              </details>
              <div className="gpu-menu-settings">
                <label>
                  <input
                    type="checkbox"
                    checked={reduced}
                    onChange={(e) => {
                      setReduced(e.target.checked);
                      if (e.target.checked) setSpin(false);
                    }}
                  />{" "}
                  Still mode
                </label>
                {mode !== "vault" && (
                  <>
                    <button
                      aria-label="Reset card orientation"
                      onClick={() => scene.current?.reset()}
                    >
                      Reset card
                    </button>
                    <button
                      aria-pressed={spin}
                      disabled={reduced}
                      onClick={() => setSpin(!spin)}
                    >
                      Auto rotate
                    </button>
                  </>
                )}
              </div>
              <a className="gpu-menu-foundations" href="/pc/guide">
                PC foundations & assembly ↗
              </a>
            </div>
          )}
          {panel === "guide" && (
            <GPUGuideChat
              key={selected.id + design.id}
              gpu={selected}
              design={design}
            />
          )}
          {panel === "catalog" && (
            <Catalog
              onSelect={chooseGpu}
              selected={selected}
              compare={compare}
              toggleCompare={toggleCompare}
            />
          )}
          {panel === "designs" && (
            <>
              <p className="gpu-panel-intro">
                Six real products. Different proportions, cooling and finishes.
                Choose one to inspect its 3D design study or original
                manufacturer photography.
              </p>
              <div className="gpu-design-grid">
                {designs.map((d) => (
                  <button key={d.id} onClick={() => chooseDesign(d)}>
                    {d.photos[0] ? (
                      <img
                        src={`/gpu/${d.photos[0]}`}
                        alt={`${d.brand} ${d.name} product photograph`}
                      />
                    ) : (
                      <span className="gpu-design-no-photo">
                        3D DESIGN STUDY
                      </span>
                    )}
                    <span className="gpu-mono">
                      {d.brand.toUpperCase()} /{" "}
                      {gpus.find((g) => g.id === d.gpu).name}
                    </span>
                    <h3>{d.name}</h3>
                    <span className="gpu-design-grid-meta">
                      {d.length}mm · {d.slots} slots
                      <Arrow />
                    </span>
                  </button>
                ))}
              </div>
              <p className="gpu-fineprint">
                Manufacturer photos are credited to their respective owners and
                linked from the inspection desk. 3D models are original,
                simplified visual studies, not exact CAD or teardown diagrams.
                The museum racks are grouped by GPU generation. Specific
                photographed partner products appear in this design archive.
                Availability and warranty vary by country.
              </p>
            </>
          )}
          {panel === "basics" && <Basics />}
          {panel === "compare" && (
            <>
              <p className="gpu-panel-intro">
                Compare reference specifications. More VRAM or a wider bus alone
                does not guarantee better game performance.
              </p>
              {compared.length ? (
                <>
                  <div className="gpu-comparison">
                    {compared.map((g) => (
                      <article key={g.id}>
                        <span
                          className="gpu-mono"
                          style={{ color: makers[g.maker].color }}
                        >
                          {g.maker.toUpperCase()}
                        </span>
                        <h3>{g.name}</h3>
                        <dl>
                          {[
                            ["Architecture", g.architecture],
                            ["Memory", `${g.vram}GB ${g.memory}`],
                            ["Memory bus", `${g.bus}-bit`],
                            ["Board power", `${g.watts}W`],
                            ["Generation", g.generation],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <dt>{k}</dt>
                              <dd>{v}</dd>
                            </div>
                          ))}
                        </dl>
                        <a href={g.source} target="_blank" rel="noreferrer">
                          Manufacturer specs ↗
                        </a>
                        <button onClick={() => toggleCompare(g.id)}>
                          Remove
                        </button>
                      </article>
                    ))}
                  </div>
                  <p className="gpu-fineprint">
                    Board power is the reference GPU/card rating, not the whole
                    PC’s PSU requirement. Partner boards can use different
                    limits. RTX 4070 and RTX 3060 Ti have more than one memory
                    configuration; check the exact retail SKU.
                  </p>
                </>
              ) : (
                <p className="gpu-empty-compare">
                  Your comparison desk is empty. Add up to three GPUs using the
                  + buttons in the model index.
                </p>
              )}
              <button
                className="gpu-primary"
                onClick={() => setPanel("catalog")}
              >
                Choose GPU models <Arrow />
              </button>
            </>
          )}
        </Dialog>
      )}
    </main>
  );
}

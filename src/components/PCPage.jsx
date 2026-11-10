import { useEffect, useRef, useState } from "react";
import LogoMark from "./LogoMark";
import {
  components,
  assemblySteps,
  glossary,
  quiz,
  checkBuild,
  sources,
} from "./pcData";
import "./pc.css";

function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* The guide also works without storage. */
  }
}

function Icon({ id, size = 24 }) {
  const paths = {
    cpu: (
      <>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </>
    ),
    motherboard: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="1" />
        <rect x="7" y="5" width="6" height="6" />
        <path d="M16 5v8m-9 2h10M7 18h10" />
      </>
    ),
    ram: (
      <>
        <rect x="2" y="6" width="20" height="11" rx="1" />
        <path d="M6 17v3m4-3v3m4-3v3m4-3v3M6 9v5m4-5v5m4-5v5m4-5v5" />
      </>
    ),
    gpu: (
      <>
        <rect x="3" y="5" width="18" height="13" rx="2" />
        <circle cx="9" cy="11.5" r="3" />
        <circle cx="17" cy="11.5" r="2" />
        <path d="M1 3v17m5-2v3h8v-3" />
      </>
    ),
    ssd: (
      <>
        <rect x="2" y="7" width="20" height="10" rx="2" />
        <path d="M7 10h7v4H7zM18 10v4" />
        <path d="M3 11v2" />
      </>
    ),
    psu: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="12" cy="12" r="6" />
        <path d="m13 8-4 5h4l-2 4" />
      </>
    ),
    cooling: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="3" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 10c-6-7 8-9 3 0M14 12c7-6 9 8 0 3M12 14c6 7-8 9-3 0M10 12c-7 6-9-8 0-3" />
      </>
    ),
    case: (
      <>
        <rect x="5" y="2" width="14" height="19" rx="2" />
        <path d="M5 6h14M8 21v2m8-2v2M8 4h1m2 0h1" />
        <circle cx="12" cy="11" r="2" />
        <circle cx="12" cy="17" r="2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[id] || paths.cpu}
    </svg>
  );
}

function SectionTitle({ number, eyebrow, title, text }) {
  return (
    <div className="pc-section-title">
      <p className="pc-eyebrow">
        <span>{number}</span> {eyebrow}
      </p>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function ThreeComputer({
  selected,
  exploded,
  autoRotate,
  mode,
  step,
  reduced,
  onSelect,
  resetRef,
}) {
  const host = useRef(null),
    engine = useRef(null);
  const [status, setStatus] = useState("loading");
  const current = useRef({
    selected,
    exploded,
    autoRotate,
    mode,
    reduced,
    visible: mode === "assemble" ? assemblySteps[step].visible : null,
  });
  current.current = {
    selected,
    exploded,
    autoRotate,
    mode,
    reduced,
    visible: mode === "assemble" ? assemblySteps[step].visible : null,
  };
  useEffect(() => {
    let cancelled = false,
      instance;
    import("./pcScene")
      .then(({ createPCScene }) => {
        if (cancelled) return;
        try {
          instance = createPCScene(host.current, onSelect, () =>
            setStatus("ready"),
          );
          engine.current = instance;
          instance.update(current.current);
          resetRef.current = () => instance.reset();
        } catch {
          host.current?.querySelectorAll("canvas").forEach((c) => c.remove());
          setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });
    return () => {
      cancelled = true;
      instance?.dispose();
      engine.current = null;
      resetRef.current = null;
    };
  }, [onSelect, resetRef]);
  useEffect(() => {
    engine.current?.update(current.current);
  }, [selected, exploded, autoRotate, mode, step, reduced]);
  return (
    <>
      <div className="pc-three-host" ref={host} data-scene-status={status} />
      {status === "loading" && (
        <div className="pc-scene-loading">
          <span className="pc-loader" />
          Preparing your workbench…
        </div>
      )}
      {status === "fallback" && (
        <div className="pc-fallback">
          <div className="pc-fallback-board">
            {components.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                style={{ "--part-color": c.color }}
                aria-label={`Explore ${c.name}`}
              >
                <Icon id={c.id} size={36} />
                <span>{c.short}</span>
              </button>
            ))}
          </div>
          <p>
            3D is unavailable in this browser. Every lesson and component
            control still works.
          </p>
        </div>
      )}
    </>
  );
}

function BuildCheck() {
  const [build, setBuild] = useState({
    cpu: "AM5",
    board: "AM5",
    ram: "DDR5",
    gpu: true,
    igpu: true,
    cooler: true,
    storage: true,
  });
  const [costs, setCosts] = useState(() => readSaved("awba-pc-costs", {}));
  const issues = checkBuild(build),
    errors = issues.filter((i) => i.severity === "error");
  const total = Object.values(costs).reduce(
    (sum, n) => sum + (Number(n) || 0),
    0,
  );
  const set = (key, value) => setBuild((b) => ({ ...b, [key]: value }));
  return (
    <section className="pc-section" id="build-check">
      <SectionTitle
        number="03"
        eyebrow="COMPATIBILITY LAB"
        title="Make the mistakes here."
        text="Change a part. See why it fits—or why the PC will not work. This simplified lab teaches the rules before you buy."
      />
      <div className="pc-check-grid">
        <div className="pc-config">
          <div className="pc-panel-heading">
            <span className="pc-dot" /> YOUR PRACTICE BUILD{" "}
            <button
              onClick={() =>
                setBuild({
                  cpu: "AM5",
                  board: "AM5",
                  ram: "DDR5",
                  gpu: true,
                  igpu: true,
                  cooler: true,
                  storage: true,
                })
              }
            >
              Reset ↺
            </button>
          </div>
          <div className="pc-select-grid">
            <label>
              CPU platform
              <select
                aria-label="CPU platform"
                value={build.cpu}
                onChange={(e) => set("cpu", e.target.value)}
              >
                <option>AM5</option>
                <option>AM4</option>
              </select>
            </label>
            <label>
              Motherboard socket
              <select
                aria-label="Motherboard socket"
                value={build.board}
                onChange={(e) => set("board", e.target.value)}
              >
                <option>AM5</option>
                <option>AM4</option>
              </select>
            </label>
            <label>
              Memory generation
              <select
                aria-label="Memory generation"
                value={build.ram}
                onChange={(e) => set("ram", e.target.value)}
              >
                <option>DDR5</option>
                <option>DDR4</option>
              </select>
            </label>
          </div>
          <div className="pc-toggles">
            {[
              ["gpu", "Dedicated graphics card"],
              ["igpu", "CPU has integrated graphics"],
              ["cooler", "Compatible CPU cooler"],
              ["storage", "Bootable storage"],
            ].map(([key, title]) => (
              <label key={key}>
                <span>{title}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={build[key]}
                  onChange={(e) => set(key, e.target.checked)}
                />
                <i aria-hidden="true" />
              </label>
            ))}
          </div>
          <p className="pc-small">
            CPU, motherboard, RAM and a suitable PSU are assumed present.
            Integrated graphics is a per-model choice, not a property of every
            AM4 or AM5 CPU.
          </p>
        </div>
        <div className="pc-check-result" aria-live="polite">
          <span
            className={`pc-result-symbol ${errors.length ? "is-error" : ""}`}
          >
            {errors.length ? "×" : "✓"}
          </span>
          <p className="pc-eyebrow">
            {errors.length
              ? `${errors.length} BLOCKING ${errors.length === 1 ? "ISSUE" : "ISSUES"}`
              : "BASIC RULES CHECKED"}
          </p>
          <h3>
            {errors.length
              ? "These parts need a rethink."
              : "A compatible starting point."}
          </h3>
          {issues.map((issue, i) => (
            <div className={`pc-issue ${issue.severity}`} key={i}>
              <b>{issue.title}</b>
              <p>{issue.text}</p>
            </div>
          ))}
          {!issues.length && (
            <p>
              The platform, memory generation, graphics output, cooling and
              storage choices line up in this example.
            </p>
          )}
          <p className="pc-small">
            Before buying: check the exact CPU support list and BIOS, RAM kit,
            GPU and cooler clearance, PSU model and connectors. This is not a
            full parts configurator or an FPS prediction.
          </p>
        </div>
      </div>
      <details className="pc-price-details">
        <summary>
          <span>₹</span> Have a shop quote? Add up your actual parts.
          <span>＋</span>
        </summary>
        <div className="pc-price-body">
          <p>
            Enter GST-inclusive prices from your quote. No live prices or
            performance claims are assumed. Saved only in this browser.
          </p>
          <div className="pc-cost-grid">
            {components.map((c) => (
              <label key={c.id}>
                {c.name}
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  step="1"
                  inputMode="numeric"
                  placeholder="₹ 0"
                  value={costs[c.id] ?? ""}
                  onChange={(e) => {
                    const next = {
                      ...costs,
                      [c.id]: Math.max(
                        0,
                        Math.min(10000000, Number(e.target.value)),
                      ),
                    };
                    setCosts(next);
                    save("awba-pc-costs", next);
                  }}
                />
              </label>
            ))}
          </div>
          <div className="pc-cost-total">
            <span>
              Parts subtotal{" "}
              <small>Excludes monitor, OS, shipping and assembly</small>
            </span>
            <strong>
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(total)}
            </strong>
            <button
              onClick={() => {
                setCosts({});
                save("awba-pc-costs", {});
              }}
            >
              Clear prices
            </button>
          </div>
        </div>
      </details>
    </section>
  );
}

function FrameLab() {
  const [hz, setHz] = useState(360),
    [fps, setFps] = useState(400);
  const [resolution, setResolution] = useState("1440×1080");
  const pixels = {
    "1280×960": 1228800,
    "1440×1080": 1555200,
    "1920×1080": 2073600,
    "2560×1440": 3686400,
  };
  return (
    <section className="pc-section" id="performance">
      <div className="pc-performance-grid">
        <div>
          <SectionTitle
            number="04"
            eyebrow="THE CS2 QUESTION"
            title={
              <>
                More than a<br />
                big FPS number.
              </>
            }
            text="Your CPU prepares a frame. Your GPU draws it. Your monitor displays it. Those are three different jobs."
          />
          <div className="pc-frame-copy">
            <p>
              <b>For your stretched 4:3 setup</b>
              <br />
              Stretching changes the shape of the displayed image. Rendering
              fewer pixels can reduce GPU work. It does not remove a CPU limit.
            </p>
            <p>
              <b>Look at the slow moments</b>
              <br />
              Average FPS can hide stutters. Compare frame-time plots and 1%
              lows in real matches at the same settings and game version.
            </p>
          </div>
        </div>
        <div className="pc-frame-lab">
          <div className="pc-panel-heading">
            FRAME-TIME EXPLORER <span>ILLUSTRATIVE</span>
          </div>
          <label className="pc-range-label">
            Monitor refresh <strong>{hz} Hz</strong>
          </label>
          <div className="pc-segment">
            {[144, 240, 360].map((n) => (
              <button key={n} onClick={() => setHz(n)} aria-pressed={hz === n}>
                {n}Hz
              </button>
            ))}
          </div>
          <label className="pc-range-label" htmlFor="pc-fps">
            Game frame rate <strong>{fps} FPS</strong>
          </label>
          <input
            id="pc-fps"
            type="range"
            min="60"
            max="600"
            step="10"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
          />
          <div className="pc-time-bars">
            <div>
              <span>Display interval</span>
              <i style={{ width: `${Math.min(100, (144 / hz) * 100)}%` }} />
              <b>{(1000 / hz).toFixed(2)} ms</b>
            </div>
            <div>
              <span>Game frame interval</span>
              <i style={{ width: `${Math.min(100, (144 / fps) * 100)}%` }} />
              <b>{(1000 / fps).toFixed(2)} ms</b>
            </div>
          </div>
          <p className="pc-frame-verdict">
            {fps >= hz
              ? "The game produces frames more frequently than this display refreshes. That can reduce frame age, but display behaviour also depends on sync and latency settings."
              : "The display can refresh faster than the game produces frames. It may show the same game frame across multiple refreshes."}
          </p>
          <div className="pc-resolution">
            <label htmlFor="pc-resolution">
              Pixels per frame
              <select
                id="pc-resolution"
                aria-label="Pixels per frame"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                {Object.keys(pixels).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <strong>
              {(pixels[resolution] / 1000000).toFixed(2)}
              <small>million pixels</small>
            </strong>
          </div>
          <p className="pc-small">
            Timing arithmetic, not a benchmark. Frame interval is not total
            input latency. A 360Hz monitor does not guarantee 360 FPS, and no
            parts list guarantees a fixed minimum in every CS2 situation.
          </p>
        </div>
      </div>
      <div className="pc-buying">
        <div>
          <span className="pc-eyebrow">CHOOSE YOUR FORMAT</span>
          <h3>Build it, buy it assembled, or take it with you.</h3>
        </div>
        <div className="pc-format">
          <h4>Custom desktop</h4>
          <p>
            Choose every part and assemble it yourself. Most parts can be
            replaced within size, power and platform limits.
          </p>
          <span>Maximum control</span>
        </div>
        <div className="pc-format">
          <h4>Shop-assembled PC</h4>
          <p>
            A retailer builds and tests it. Request exact part models, RAM
            configuration, warranty terms and how the GPU is shipped.
          </p>
          <span>Convenience + upgrade options</span>
        </div>
        <div className="pc-format">
          <h4>Gaming laptop</h4>
          <p>
            Portable and includes a screen. CPU and GPU are usually soldered.
            RAM, storage, cooling and display-output support vary by model.
          </p>
          <span>Choose for portability</span>
        </div>
      </div>
    </section>
  );
}

function Knowledge() {
  const [query, setQuery] = useState(""),
    [answers, setAnswers] = useState(() => readSaved("awba-pc-quiz", {}));
  const [decoder, setDecoder] = useState("cpu");
  const decoders = {
    cpu: {
      label: "Processor",
      name: "AMD Ryzen 5 9600X",
      tokens: [
        ["Ryzen", "AMD’s processor family"],
        ["5", "Product tier, not the core count"],
        ["9000", "This desktop product family"],
        ["9600X", "The exact model and suffix"],
      ],
      note: "Do not compare tiers across generations or brands as if they were a speed score. A newer Ryzen 5 can outperform an older Ryzen 7. Check benchmarks and the CPU’s exact socket.",
    },
    gpu: {
      label: "Graphics card",
      name: "GeForce RTX 5060 8GB",
      tokens: [
        ["GeForce RTX", "NVIDIA’s graphics family"],
        ["50", "The product series"],
        ["60", "Position within this series"],
        ["8GB", "Video-memory capacity"],
      ],
      note: "The same number with “Laptop GPU” names a different product. Ti, Super, OC and vendor cooling labels also have different meanings; compare the exact model, not only the longest name.",
    },
    ram: {
      label: "Memory kit",
      name: "32GB (2×16GB) DDR5-6000 CL30",
      tokens: [
        ["32GB", "Total capacity"],
        ["2×16GB", "Two matched 16GB modules"],
        ["DDR5-6000", "Generation and transfer rate in MT/s"],
        ["CL30", "CAS latency in clock cycles"],
      ],
      note: "At 6000 MT/s, CL30 corresponds to a nominal CAS delay of 10ns. That is only one part of total memory latency. Check motherboard support, module count and profile stability too.",
    },
    storage: {
      label: "Storage drive",
      name: "2TB M.2 2280 PCIe 4.0 NVMe",
      tokens: [
        ["2TB", "Advertised storage capacity"],
        ["M.2 2280", "22mm wide, 80mm long"],
        ["PCIe 4.0", "The connection generation"],
        ["NVMe", "Storage communication protocol"],
      ],
      note: "Shape, protocol and speed are separate specifications. M.2 does not automatically mean NVMe, and a faster sequential read rating does not promise more FPS.",
    },
  };
  const score = quiz.filter((q, i) => answers[i] === q.correct).length;
  return (
    <section className="pc-section" id="learn">
      <SectionTitle
        number="05"
        eyebrow="MAKE IT STICK"
        title="Speak the language."
        text="A small vocabulary makes a wall of specifications much less intimidating."
      />
      <div className="pc-decoder">
        <div className="pc-decoder-top">
          <span className="pc-eyebrow">READ A SPECIFICATION</span>
          <div role="group" aria-label="Specification examples">
            {Object.entries(decoders).map(([id, d]) => (
              <button
                key={id}
                aria-pressed={decoder === id}
                onClick={() => setDecoder(id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <h3>{decoders[decoder].name}</h3>
        <div className="pc-decoder-tokens">
          {decoders[decoder].tokens.map(([token, meaning]) => (
            <div key={token}>
              <b>{token}</b>
              <span>{meaning}</span>
            </div>
          ))}
        </div>
        <p>{decoders[decoder].note}</p>
      </div>
      <div className="pc-glossary-heading">
        <span>{glossary.length} ESSENTIAL TERMS</span>
        <label>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="6" />
            <path d="m15 15 5 5" />
          </svg>
          <input
            type="search"
            aria-label="Search glossary"
            placeholder="Find a term…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="pc-glossary">
        {glossary
          .filter(([term, desc]) =>
            `${term} ${desc}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map(([term, desc]) => (
            <article key={term}>
              <h3>{term}</h3>
              <p>{desc}</p>
            </article>
          ))}
      </div>
      {!glossary.some(([term, desc]) =>
        `${term} ${desc}`.toLowerCase().includes(query.toLowerCase()),
      ) && (
        <p className="pc-empty">
          No matching terms. Try “memory”, “FPS” or “power”.
        </p>
      )}
      <div className="pc-quiz-heading">
        <div>
          <p className="pc-eyebrow">CHECK YOUR UNDERSTANDING</p>
          <h3>Ready for the next build?</h3>
        </div>
        <div className="pc-quiz-score" aria-live="polite">
          <strong>
            {score}
            <span> / {quiz.length}</span>
          </strong>
          <small>correct answers</small>
        </div>
      </div>
      <div className="pc-quiz">
        {quiz.map((q, i) => (
          <fieldset key={q.q}>
            <legend>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {q.q}
            </legend>
            <div>
              {q.a.map((answer, n) => (
                <button
                  key={answer}
                  aria-pressed={answers[i] === n}
                  className={
                    answers[i] === n
                      ? n === q.correct
                        ? "correct"
                        : "incorrect"
                      : ""
                  }
                  onClick={() => {
                    const next = { ...answers, [i]: n };
                    setAnswers(next);
                    save("awba-pc-quiz", next);
                  }}
                >
                  <span>
                    {answers[i] === n
                      ? n === q.correct
                        ? "✓"
                        : "×"
                      : String.fromCharCode(65 + n)}
                  </span>
                  {answer}
                </button>
              ))}
            </div>
            {answers[i] != null && (
              <p className="pc-quiz-feedback" role="status">
                {answers[i] === q.correct ? "Exactly. " : "Try again. "}
                {q.why}
              </p>
            )}
          </fieldset>
        ))}
      </div>
      <button
        className="pc-text-button"
        onClick={() => {
          setAnswers({});
          save("awba-pc-quiz", {});
        }}
      >
        Reset knowledge check ↺
      </button>
      <div className="pc-next-level">
        <div>
          <p className="pc-eyebrow">AFTER YOUR FIRST BOOT</p>
          <h3>A builder learns to diagnose.</h3>
          <p>
            Change one thing at a time. Record what changed and retest.
            Disconnect mains power before reseating parts, and follow the exact
            hardware manuals.
          </p>
        </div>
        <div className="pc-troubleshooting">
          {[
            [
              "Nothing happens when I press power",
              "Check the wall outlet, PSU switch, mains cable, motherboard 24-pin, CPU EPS cable and case power-button header. A spinning fan does not prove the system passed POST. Never open the PSU.",
            ],
            [
              "Fans spin, but there is no picture",
              "Check the monitor input and cable, then use the GPU’s display port if a dedicated GPU is installed. Inspect the board’s diagnostic LEDs. CPU-integrated graphics only works when the exact processor supports it.",
            ],
            [
              "The DRAM light stays on",
              "Initial memory training can take time; follow the board’s guidance. With power disconnected, check seating and recommended slots. Test one module at default settings. Refer to the manual for safely clearing CMOS if needed.",
            ],
            [
              "Temperatures rise or the PC slows down",
              "Inspect cooler mounting, protective film, thermal interface, fan and pump connections, and case airflow. Compare temperatures with the exact CPU’s guidance. Stop and investigate if cooling is not operating correctly.",
            ],
            [
              "CS2 FPS is lower than I expected",
              "Record the resolution, graphics settings and game version. Check temperatures, clock speeds, CPU/GPU utilisation, memory configuration, background work and frame-time spikes. Change one setting and retest the same workload.",
            ],
          ].map(([title, text]) => (
            <details key={title}>
              <summary>
                {title}
                <span>＋</span>
              </summary>
              <p>{text}</p>
            </details>
          ))}
        </div>
      </div>
      <div className="pc-extras">
        <article>
          <span>NETWORK + AUDIO</span>
          <h4>Often already on the board.</h4>
          <p>
            Ethernet and audio are commonly integrated. WiFi and Bluetooth
            depend on the exact motherboard. Add-in cards and adapters are
            optional when you need missing features.
          </p>
        </article>
        <article>
          <span>DISPLAY + CONTROLS</span>
          <h4>The rest of your setup.</h4>
          <p>
            A monitor, keyboard and mouse complete the experience. Check the
            monitor’s inputs and the GPU’s output support for your chosen
            resolution and refresh rate.
          </p>
        </article>
        <article>
          <span>SOFTWARE + CARE</span>
          <h4>Hardware is the beginning.</h4>
          <p>
            Install the OS and correct chipset and graphics drivers. Keep
            backups, clean dust filters and verify stability before tuning.
            Firmware updates need the board’s exact instructions.
          </p>
        </article>
      </div>
      <div className="pc-sources">
        <div>
          <p className="pc-eyebrow">KEEP EXPLORING</p>
          <h3>Go to the source.</h3>
          <p>
            For actual assembly, the manuals for your exact parts take priority.
            Platform and product examples are educational, not a current buying
            shortlist.
          </p>
        </div>
        <div>
          {sources.map(([brand, title, href]) => (
            <a key={brand} href={href} target="_blank" rel="noreferrer">
              <span>
                {brand}
                <b>{title}</b>
              </span>
              <span>↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PCPage() {
  const [selected, setSelected] = useState("cpu"),
    [detailTab, setDetailTab] = useState("basics"),
    [mode, setMode] = useState("inspect");
  const [exploded, setExploded] = useState(false),
    [autoRotate, setAutoRotate] = useState(false),
    [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [seen, setSeen] = useState(() => readSaved("awba-pc-seen", ["cpu"]));
  const resetRef = useRef(null),
    selectRef = useRef(null);
  const part = components.find((c) => c.id === selected) || components[0];
  selectRef.current = (id) => {
    setSelected(id);
    setSeen((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      save("awba-pc-seen", next);
      return next;
    });
  };
  const stableSelect = useRef((id) => selectRef.current(id)).current;
  useEffect(() => {
    document.title = "Inside the PC — An interactive field guide | Awba";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Learn how a PC works. Explore an interactive 3D computer, compare components, practise assembly and check compatibility—from your first part to your first boot.",
      );
  }, []);
  useEffect(() => {
    if (mode === "assemble") stableSelect(assemblySteps[step].part);
  }, [step, mode, stableSelect]);
  const changeMode = (next) => {
    setMode(next);
    if (next !== "inspect") setExploded(false);
  };
  return (
    <div className="pc-page">
      <a className="pc-skip" href="#workbench">
        Skip to interactive workbench
      </a>
      <header className="pc-header">
        <a href="/" className="pc-brand" aria-label="Awba home">
          <LogoMark />
          <b>
            awba<span>/</span>
          </b>
          <span>FIELD GUIDES</span>
        </a>
        <nav aria-label="PC guide navigation">
          <a href="#workbench">Explore</a>
          <a href="#minimum">The essentials</a>
          <a href="#build-check">Build check</a>
          <a href="#learn">Learn</a>
        </nav>
        <a className="pc-header-end" href="#learn">
          From curious to confident <span>↗</span>
        </a>
      </header>
      <main>
        <section className="pc-hero">
          <div>
            <p className="pc-eyebrow">
              <span className="pc-dot" /> THE PERSONAL COMPUTER, EXPLAINED
            </p>
            <h1>
              Inside the <span>PC.</span>
            </h1>
            <p className="pc-hero-copy">
              Every part has a purpose.
              <br />
              Get to know yours, one component at a time.
            </p>
            <a className="pc-start" href="#workbench">
              Open the workbench <span>↘</span>
            </a>
          </div>
          <div className="pc-hero-aside">
            <span className="pc-edition">
              AN INTERACTIVE FIELD GUIDE
              <br />
              VOL. 01 — HARDWARE
            </span>
            <div
              className="pc-progress-ring"
              style={{
                "--progress": `${(Math.min(seen.length, 8) / 8) * 100}%`,
              }}
            >
              <div>
                <strong>
                  {Math.min(seen.length, 8)}
                  <span>/8</span>
                </strong>
                <small>parts explored</small>
              </div>
            </div>
            <p>
              No experience required.
              <br />
              Just a little curiosity.
            </p>
          </div>
        </section>
        <section
          className="pc-workbench"
          id="workbench"
          aria-label="Interactive PC workbench"
        >
          <div className="pc-bench-top">
            <div
              className="pc-mode-tabs"
              role="group"
              aria-label="Workbench mode"
            >
              {[
                ["inspect", "01", "Explore"],
                ["assemble", "02", "Assemble"],
                ["flow", "03", "Follow the data"],
              ].map(([id, n, title]) => (
                <button
                  key={id}
                  onClick={() => changeMode(id)}
                  aria-pressed={mode === id}
                >
                  <span>{n}</span>
                  {title}
                </button>
              ))}
            </div>
            <span className="pc-bench-top-note">
              <i className="pc-dot" /> YOUR VIRTUAL WORKBENCH
            </span>
          </div>
          <div className="pc-workbench-grid">
            <aside className="pc-parts">
              <div className="pc-parts-heading">
                THE COMPONENTS <span>08</span>
              </div>
              {components.map((c, index) => (
                <button
                  key={c.id}
                  className={selected === c.id ? "selected" : ""}
                  style={{ "--part-color": c.color }}
                  onClick={() => stableSelect(c.id)}
                  aria-pressed={selected === c.id}
                  aria-label={`Explore ${c.name}`}
                >
                  <span className="pc-part-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon id={c.id} />
                  <span>
                    {c.name}
                    <small>{c.short}</small>
                  </span>
                  <span className="pc-part-arrow">↗</span>
                </button>
              ))}
              <div className="pc-parts-footer">
                <span>LEARNING BY LOOKING</span>
                <p>
                  Pick a part in the model
                  <br />
                  or in this list.
                </p>
              </div>
            </aside>
            <div className="pc-scene-panel">
              <div className="pc-scene-top">
                <span>
                  {mode === "assemble"
                    ? `ASSEMBLY · STEP ${String(step + 1).padStart(2, "0")}`
                    : mode === "flow"
                      ? "A FRAME’S JOURNEY"
                      : exploded
                        ? "EXPLODED VIEW"
                        : "DESKTOP · SIDE PANEL OPEN"}
                  <small>
                    {mode === "flow"
                      ? "Storage → memory → CPU → GPU"
                      : "Schematic model · not to scale"}
                  </small>
                </span>
                <span className="pc-scene-cross">＋</span>
              </div>
              <ThreeComputer
                selected={selected}
                exploded={exploded}
                autoRotate={autoRotate}
                mode={mode}
                step={step}
                reduced={reduced}
                onSelect={stableSelect}
                resetRef={resetRef}
              />
              <div
                className="pc-scene-selected"
                style={{ "--part-color": part.color }}
              >
                <i />
                <span>
                  {part.short}
                  <small>{part.connection}</small>
                </span>
              </div>
              <div className="pc-scene-toolbar">
                <button
                  onClick={() => {
                    setExploded((v) => !v);
                    if (mode !== "inspect") setMode("inspect");
                  }}
                  aria-pressed={exploded}
                  aria-label="Toggle exploded view"
                >
                  <span>⤢</span> Explode
                </button>
                <button
                  onClick={() => setAutoRotate((v) => !v)}
                  aria-pressed={autoRotate}
                  disabled={reduced}
                >
                  <span>⟳</span> Rotate
                </button>
                <button
                  onClick={() => resetRef.current?.()}
                  aria-label="Reset 3D camera"
                >
                  <span>⌖</span> Reset view
                </button>
              </div>
              <div className="pc-scene-help">
                Drag to orbit <span>·</span> Scroll / pinch to zoom{" "}
                <span>·</span> Click to explore
              </div>
            </div>
            <aside
              className="pc-inspector"
              style={{ "--part-color": part.color }}
              aria-label="Component details"
            >
              <div className="pc-inspector-top">
                <span className="pc-component-badge">{part.short}</span>
                <span>{part.required}</span>
              </div>
              <div className="pc-inspector-title">
                <Icon id={part.id} size={34} />
                <h2>{part.name}</h2>
                <p>{part.full}</p>
              </div>
              <div
                className="pc-detail-tabs"
                role="group"
                aria-label="Component information"
              >
                <button
                  aria-pressed={detailTab === "basics"}
                  onClick={() => setDetailTab("basics")}
                >
                  The basics
                </button>
                <button
                  aria-pressed={detailTab === "types"}
                  onClick={() => setDetailTab("types")}
                >
                  Types & generations
                </button>
              </div>
              <div
                className="pc-inspector-content"
                key={`${selected}-${detailTab}`}
              >
                {detailTab === "basics" ? (
                  <>
                    <h3>{part.role}</h3>
                    <p>{part.intro}</p>
                    <div className="pc-where">
                      <span>WHERE IT GOES</span>
                      <p>{part.where}</p>
                    </div>
                    <h4>What to look for</h4>
                    {part.specs.map(([title, text]) => (
                      <div className="pc-spec" key={title}>
                        <b>{title}</b>
                        <p>{text}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <h3>Know your options.</h3>
                    {part.variants.map(([title, sub, text]) => (
                      <article className="pc-variant" key={title}>
                        <h4>{title}</h4>
                        <span>{sub}</span>
                        <p>{text}</p>
                      </article>
                    ))}
                  </>
                )}
                <div className="pc-part-note">
                  <span>↳ FOR CS2</span>
                  <p>{part.cs2}</p>
                </div>
                <details className="pc-watch">
                  <summary>
                    Before you fit this part <span>＋</span>
                  </summary>
                  <p>{part.watch}</p>
                </details>
              </div>
            </aside>
          </div>
          {mode === "assemble" && (
            <div className="pc-assembly" aria-live="polite">
              <div className="pc-assembly-number">
                {String(step + 1).padStart(2, "0")}
                <small>/ {assemblySteps.length}</small>
              </div>
              <div>
                <p className="pc-eyebrow">A GUIDED FIRST BUILD</p>
                <h3>{assemblySteps[step].title}</h3>
                <p>{assemblySteps[step].text}</p>
                <p className="pc-assembly-check">
                  <b>Check:</b> {assemblySteps[step].check}
                </p>
              </div>
              <div className="pc-assembly-actions">
                <div className="pc-step-dots">
                  {assemblySteps.map((s, i) => (
                    <button
                      key={s.title}
                      aria-label={`Assembly step ${i + 1}: ${s.title}`}
                      aria-current={step === i ? "step" : undefined}
                      onClick={() => setStep(i)}
                    />
                  ))}
                </div>
                <div>
                  <button
                    disabled={step === 0}
                    onClick={() => setStep((s) => s - 1)}
                    aria-label="Previous assembly step"
                  >
                    ←
                  </button>
                  <button
                    onClick={() =>
                      setStep((s) =>
                        s === assemblySteps.length - 1 ? 0 : s + 1,
                      )
                    }
                  >
                    {step === assemblySteps.length - 1
                      ? "Start again ↺"
                      : "Next step →"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {mode === "flow" && (
            <div className="pc-flow">
              <div>
                <span>01</span>
                <b>Storage</b>
                <p>Load the game’s files.</p>
              </div>
              <i>→</i>
              <div>
                <span>02</span>
                <b>RAM</b>
                <p>Keep active data close.</p>
              </div>
              <i>→</i>
              <div>
                <span>03</span>
                <b>CPU</b>
                <p>Simulate and prepare.</p>
              </div>
              <i>→</i>
              <div>
                <span>04</span>
                <b>GPU + display</b>
                <p>Render, then show.</p>
              </div>
              <small>
                A simplified explanation. Real hardware works concurrently and
                exchanges data in both directions.
              </small>
            </div>
          )}
          <div className="pc-bench-bottom">
            <span>
              <b>TIP</b> Try the exploded view to see how the parts fit
              together.
            </span>
            <label>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />{" "}
              Reduce motion
            </label>
          </div>
        </section>
        <section className="pc-section" id="minimum">
          <div className="pc-minimum-grid">
            <SectionTitle
              number="02"
              eyebrow="STRIP IT BACK"
              title={
                <>
                  What do you
                  <br />
                  actually need?
                </>
              }
              text="A useful PC is a system of compatible parts. You do not need the most expensive version of every one."
            />
            <div className="pc-minimum-list">
              <article>
                <span>01 / TO REACH FIRMWARE</span>
                <h3>The core system.</h3>
                <p>
                  A supported CPU, motherboard, RAM, suitable power supply and
                  CPU cooling. Add a working graphics path and a monitor to see
                  firmware.
                </p>
              </article>
              <article>
                <span>02 / TO USE AN OPERATING SYSTEM</span>
                <h3>A place to boot from.</h3>
                <p>
                  Add bootable storage and an operating system. A case, keyboard
                  and mouse make it a practical everyday computer. Reaching POST
                  is different from booting Windows.
                </p>
              </article>
              <article>
                <span>03 / TO PLAY DEMANDING GAMES</span>
                <h3>Graphics to match your goal.</h3>
                <p>
                  A dedicated GPU is the usual choice for serious gaming. It is
                  not mandatory for every PC: integrated graphics can provide a
                  picture if the exact CPU supports it.
                </p>
              </article>
            </div>
          </div>
          <div className="pc-essential-note">
            <Icon id="cpu" />
            <p>
              <b>Start with the job. Then choose the parts.</b> For CS2, compare
              real matches at your resolution, settings and game version. For a
              prebuilt, get the exact parts list—not just “i7 gaming PC”.
            </p>
            <a href="#build-check">Try the build check ↗</a>
          </div>
        </section>
        <BuildCheck />
        <FrameLab />
        <Knowledge />
      </main>
      <footer className="pc-footer">
        <a href="/" className="pc-brand">
          <LogoMark />
          <b>
            awba<span>/</span>
          </b>
        </a>
        <span>Understand it. Choose it. Build it.</span>
        <a href="#workbench">Back to the workbench ↑</a>
      </footer>
    </div>
  );
}

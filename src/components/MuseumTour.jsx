import { useEffect, useState } from "react";
import { tourChapters, tourStops } from "./gpuTour.js";

export function GuidePortrait() {
  return (
    <svg
      className="museum-guide-portrait"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="24" fill="#302728" />
      <path d="M7 48v-8c0-13 34-13 34 0v8" fill="#24262c" />
      <path d="M22 35h4v13h-4" fill="#e16a63" />
      <rect x="19" y="26" width="10" height="12" rx="4" fill="#ac7358" />
      <ellipse cx="24" cy="20" rx="11" ry="13" fill="#ac7358" />
      <path d="M13 20V13c0-12 23-12 22 3l-8-5-13 7" fill="#211b1a" />
      <circle cx="20" cy="21" r="1.2" fill="#211b1a" />
      <circle cx="28" cy="21" r="1.2" fill="#211b1a" />
      <path d="M21 27q3 3 6 0" stroke="#42241e" fill="none" strokeWidth="1.4" />
    </svg>
  );
}
export default function MuseumTour({ index, onGo, onEnd, paused }) {
  const step = tourStops[index];
  const [voice, setVoice] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const supported =
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  useEffect(() => {
    if (!supported || !voice || paused) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${step.title} ${step.text}`,
    );
    utterance.lang = "en-IN";
    utterance.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    utterance.onerror = (e) => {
      if (!["canceled", "interrupted"].includes(e.error)) setVoiceError(true);
    };
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [index, voice, paused, supported, step]);
  return (
    <section className="museum-tour" aria-label="Guided museum tour">
      <header>
        <GuidePortrait />
        <div>
          <strong>
            Ari <span>YOUR MUSEUM GUIDE</span>
          </strong>
          <small>
            {step.chapter} · {index + 1} / {tourStops.length}
          </small>
        </div>
        <button aria-label="End tour" onClick={onEnd}>
          ×
        </button>
      </header>
      <div className="museum-tour-story" aria-live="polite">
        {step.year && <span className="museum-tour-year">{step.year}</span>}
        <h1>{step.title}</h1>
        <p>{step.text}</p>
        {step.source && (
          <a href={step.source} target="_blank" rel="noreferrer">
            Manufacturer source ↗
          </a>
        )}
      </div>
      <footer>
        <button
          aria-label="Previous tour stop"
          disabled={index === 0}
          onClick={() => onGo(index - 1)}
        >
          ←
        </button>
        <button
          className="museum-tour-next"
          onClick={() =>
            index === tourStops.length - 1 ? onEnd() : onGo(index + 1)
          }
        >
          {index === tourStops.length - 1 ? "Finish tour" : "Continue"}{" "}
          <span>→</span>
        </button>
        {supported && (
          <button
            className="museum-tour-voice"
            aria-pressed={voice}
            onClick={() => {
              setVoiceError(false);
              setVoice(!voice);
            }}
          >
            {voice ? "Voice on" : "Voice off"}
          </button>
        )}
      </footer>
      <label className="museum-tour-jump">
        <span>Jump to</span>
        <select
          aria-label="Tour chapter or model"
          value={step.id}
          onChange={(e) =>
            onGo(tourStops.findIndex((s) => s.id === e.target.value))
          }
        >
          {tourChapters.map((chapter) => (
            <optgroup key={chapter} label={chapter}>
              {tourStops
                .filter((s) => s.chapter === chapter)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.year ? `${s.year} · ` : ""}
                    {s.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      {voiceError && (
        <small role="status">
          Voice is unavailable. You can keep reading the tour here.
        </small>
      )}
    </section>
  );
}

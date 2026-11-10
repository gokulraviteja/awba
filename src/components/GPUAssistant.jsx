import { useEffect, useState } from "react";
import { answerGpuQuestion, explainGpu, guideQuestions } from "./gpuGuide.js";
function useGuideVoice(identity) {
  const [speaking, setSpeaking] = useState(false);
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  useEffect(
    () => () => {
      if (supported) window.speechSynthesis.cancel();
    },
    [identity, supported],
  );
  const speak = (text) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  return { supported, speaking, speak };
}
export function GPUAssistant({ gpu, design, onAsk }) {
  const summary = explainGpu(gpu, design);
  const voice = useGuideVoice(gpu.id + design.id);
  return (
    <section
      className="gpu-assistant"
      aria-label="Museum guide"
      aria-live="polite"
    >
      <header>
        <span className="gpu-guide-mark" aria-hidden="true">
          ✳
        </span>
        <div>
          <strong>GPU explained</strong>
          <small>YOUR CARD, IN PLAIN ENGLISH</small>
        </div>
        {voice.supported && (
          <button
            onClick={() => voice.speak(summary)}
            aria-label={
              voice.speaking
                ? "Stop guide narration"
                : "Listen to this model explanation"
            }
          >
            {voice.speaking ? "Stop ■" : "Listen ▷"}
          </button>
        )}
      </header>
      <p>{summary}</p>
      <button className="gpu-guide-ask" onClick={onAsk}>
        Ask about this GPU <span>↗</span>
      </button>
    </section>
  );
}
export function GPUGuideChat({ gpu, design }) {
  const summary = explainGpu(gpu, design);
  const [question, setQuestion] = useState(""),
    [exchange, setExchange] = useState(null);
  const voice = useGuideVoice(gpu.id + design.id);
  const ask = (q) => {
    if (!q.trim()) return;
    setExchange({
      question: q.trim(),
      answer: answerGpuQuestion(q, gpu, design),
    });
    setQuestion("");
  };
  return (
    <div className="gpu-guide-chat">
      <p className="gpu-panel-intro">
        Instant explanations from the museum catalog. Ask about this model’s
        name, memory, power, design or your CS2 goal.
      </p>
      <div className="gpu-guide-summary">
        <span className="gpu-guide-mark" aria-hidden="true">
          ✳
        </span>
        <p>{summary}</p>
      </div>
      <div
        className="gpu-guide-suggestions"
        aria-label="Suggested guide questions"
      >
        {guideQuestions.map((q) => (
          <button key={q} onClick={() => ask(q)}>
            {q} ↗
          </button>
        ))}
      </div>
      {exchange && (
        <div className="gpu-guide-exchange">
          <h3>{exchange.question}</h3>
          <p aria-live="polite">{exchange.answer}</p>
        </div>
      )}
      <form
        className="gpu-guide-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="gpu-guide-question">Ask the museum guide</label>
        <div>
          <input
            id="gpu-guide-question"
            maxLength={240}
            placeholder="e.g. Is 16GB faster than 8GB?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            type="submit"
            disabled={!question.trim()}
            aria-label="Ask guide question"
          >
            ↑
          </button>
        </div>
      </form>
      <div className="gpu-guide-sources">
        {voice.supported && (
          <button onClick={() => voice.speak(exchange?.answer || summary)}>
            {voice.speaking ? "Stop narration ■" : "Listen to explanation ▷"}
          </button>
        )}
        <a href={design.url} target="_blank" rel="noreferrer">
          Official product source ↗
        </a>
      </div>
      <p className="gpu-fineprint">
        This guide uses curated explanations and model specifications. It does
        not use a live AI service, benchmark feed or price feed. Use
        manufacturer documentation for installation instructions.
      </p>
    </div>
  );
}

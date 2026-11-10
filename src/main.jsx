import "./index.css";
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

const App = lazy(() => import("./App.jsx"));
const DiwaliPage = lazy(() => import("./components/DiwaliPage.jsx"));
const GPUPage = lazy(() => import("./components/GPUPage.jsx"));
const PCPage = lazy(() => import("./components/PCPage.jsx"));
const isDiwali = window.location.pathname.replace(/\/+$/, "") === "/diwali";
const isGuide = window.location.pathname.replace(/\/+$/, "") === "/pc/guide";
const isPC = window.location.pathname.replace(/\/+$/, "") === "/pc";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense
      fallback={
        <div style={{ padding: 40 }}>
          {isPC
            ? "Powering up the PC Play Lab…"
            : isDiwali
              ? "Lighting the courtyard…"
              : "Loading Awba…"}
        </div>
      }
    >
      {isPC ? (
        <GPUPage />
      ) : isGuide ? (
        <PCPage />
      ) : isDiwali ? (
        <DiwaliPage />
      ) : (
        <App />
      )}
    </Suspense>
  </StrictMode>,
);

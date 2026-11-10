import "./index.css";
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

const App = lazy(() => import("./App.jsx"));
const DiwaliPage = lazy(() => import("./components/DiwaliPage.jsx"));
const PCPage = lazy(() => import("./components/PCPage.jsx"));
const isDiwali = window.location.pathname.replace(/\/+$/, "") === "/diwali";
const isPC = window.location.pathname.replace(/\/+$/, "") === "/pc";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense
      fallback={
        <div style={{ padding: 40 }}>
          {isDiwali ? "Lighting the courtyard…" : "Loading Awba…"}
        </div>
      }
    >
      {isPC ? <PCPage /> : isDiwali ? <DiwaliPage /> : <App />}
    </Suspense>
  </StrictMode>,
);

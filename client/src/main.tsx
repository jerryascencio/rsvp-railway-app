import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isLegacyHostname } from "./lib/event-scope";

// Leah's site lives at the domain root with hash routes (/#/ and /#/admin).
// Deep links such as /e/<slug> keep a real path, so don't force a hash there.
const atRoot = window.location.pathname === "/" || window.location.pathname === "";
if (isLegacyHostname() && atRoot && !window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Let's initialize the app with the standard React approach for now
// We'll switch to the mobile-specific approach when we build for mobile platforms
createRoot(document.getElementById("root")!).render(<App />);

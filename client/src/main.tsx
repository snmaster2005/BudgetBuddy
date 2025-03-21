import { createRoot } from "react-dom/client";
import App from "./App";
import MobileApp from "./MobileApp";
import { isPlatform } from "./utils/platform";
import "./index.css";

// Use Capacitor's device-ready event when on mobile
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById("root")!;
  const root = createRoot(rootElement);
  
  // Render either the mobile-optimized app or regular app
  if (isPlatform('capacitor')) {
    root.render(<MobileApp />);
  } else {
    root.render(<App />);
  }
});

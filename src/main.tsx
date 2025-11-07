import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOAuthListener } from './lib/mobileAuth';
import { initKeyboardHandling } from './lib/keyboardHandler';

// Initialize mobile features
initOAuthListener();
initKeyboardHandling();

createRoot(document.getElementById("root")!).render(<App />);

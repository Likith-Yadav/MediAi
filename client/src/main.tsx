import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure fonts are loaded
document.body.classList.add("font-sans", "antialiased");

createRoot(document.getElementById("root")!).render(<App />);

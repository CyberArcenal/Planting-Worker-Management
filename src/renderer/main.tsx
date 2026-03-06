// main.tsx placeholder
import ReactDOM from "react-dom/client";
import "./styles/index.css";
// import "./styles/windows-friendly.css";
// import "./styles/scrollbar.css";
import "reflect-metadata";
import React from "react";
import ConditionalRouter from "./components/Shared/ConditionalRouter";
import App from "./routes/App";
import { SettingsProvider } from "./contexts/SettingsContext";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ConditionalRouter>
        <App />
      </ConditionalRouter>
    </SettingsProvider>
  </React.StrictMode>,
)

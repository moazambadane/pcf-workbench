import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Expose React globals so virtual PCF controls inside the iframe sandbox can
// reach them via window.parent.React / window.parent.ReactDOM.
(window as unknown as Record<string, unknown>).React = React;
(window as unknown as Record<string, unknown>).ReactDOM = ReactDOM;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

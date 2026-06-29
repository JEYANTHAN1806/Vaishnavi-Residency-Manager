import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getToken } from "@/lib/auth";

// Patch global fetch to inject auth token on all API requests
const origFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const token = getToken();
  if (token) {
    const headers = new Headers((init as RequestInit).headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return origFetch(input, { ...(init as RequestInit), headers });
  }
  return origFetch(input, init as RequestInit);
};

createRoot(document.getElementById("root")!).render(<App />);

import { useLocalStorage } from "@/lib/useLocalStorage";
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <SessionProvider
        storageKey="ImageGenGallerySessionId"
        useStorage={useLocalStorage}
      >
        <App />
      </SessionProvider>
    </ConvexProvider>
  </React.StrictMode>
);

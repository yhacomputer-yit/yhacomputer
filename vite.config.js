import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The `/api/*` routes are Vercel serverless functions. In local dev we proxy
// them to a small node server that mounts the same handlers (see localdev).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8001",
    },
  },
});

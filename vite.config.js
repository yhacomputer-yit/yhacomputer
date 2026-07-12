import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import adminHandler from "./api/admin.js";
import dataHandler from "./api/data.js";

const apiHandlers = new Map([
  ["/api/admin", adminHandler],
  ["/api/data", dataHandler],
]);

function localApi() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        const handler = apiHandlers.get(url.pathname);
        if (!handler) {
          next();
          return;
        }

        req.query = Object.fromEntries(url.searchParams);
        res.status = (statusCode) => {
          res.statusCode = statusCode;
          return res;
        };
        res.json = (body) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };

        try {
          await handler(req, res);
        } catch (error) {
          if (!res.headersSent) {
            res.status(500).json({ error: String(error.message || error) });
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const name of [
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
    "ADMIN_PASSWORD",
  ]) {
    if (!process.env[name] && env[name]) {
      process.env[name] = env[name];
    }
  }

  return {
    plugins: [react(), localApi()],
  };
});

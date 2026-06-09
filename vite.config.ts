import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

const ALLOWED_ORIGINS = ["szallas.hu", "airbnb.com", "airbnb.hu"];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_ORIGINS.some(
      (o) => hostname === o || hostname.endsWith(`.${o}`)
    );
  } catch {
    return false;
  }
}

/** Dev-only middleware that proxies /api/ical?url=... server-side */
function icalProxyPlugin(): Plugin {
  return {
    name: "ical-proxy",
    configureServer(server) {
      server.middlewares.use("/api/ical", async (req, res) => {
        const rawUrl = new URL(req.url!, "http://localhost").searchParams.get("url");

        if (!rawUrl) {
          res.statusCode = 400;
          res.end("Missing ?url= parameter");
          return;
        }
        if (!isAllowed(rawUrl)) {
          res.statusCode = 403;
          res.end("Domain not allowed");
          return;
        }

        try {
          const upstream = await fetch(rawUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; ApartmanAssistant/1.0)",
              "Accept": "text/calendar, */*",
            },
          });
          const text = await upstream.text();
          res.setHeader("Content-Type", "text/calendar; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.statusCode = upstream.status;
          res.end(text);
        } catch (err) {
          res.statusCode = 502;
          res.end(`Upstream fetch failed: ${String(err)}`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), icalProxyPlugin()],
});

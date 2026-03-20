import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";
import { handleAiHubRequest } from "./server/ai-hub.js";
import { handleInviteEmailRequest } from "./server/invite-email.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.GROQ_API_KEY = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  process.env.GROQ_MODEL = env.GROQ_MODEL || process.env.GROQ_MODEL;
  process.env.GROQ_BASE_URL = env.GROQ_BASE_URL || process.env.GROQ_BASE_URL;
  process.env.OPENAI_API_KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  process.env.OPENAI_MODEL = env.OPENAI_MODEL || process.env.OPENAI_MODEL;
  process.env.RESEND_API_KEY = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  process.env.RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  process.env.RESEND_REPLY_TO = env.RESEND_REPLY_TO || process.env.RESEND_REPLY_TO;
  process.env.RESEND_SCHOOL_NAME = env.RESEND_SCHOOL_NAME || process.env.RESEND_SCHOOL_NAME;

  return {
    plugins: [
      viteSourceLocator({
        prefix: "gilbert",
      }),
      react(),
      {
        name: "local-ai-hub-api",
        configureServer(server) {
          server.middlewares.use("/api/ai-hub", async (req, res) => {
            const url = new URL(req.url || "/api/ai-hub", "http://localhost");
            const request = new Request(url.toString(), {
              method: req.method,
              headers: req.headers as HeadersInit,
              body:
                req.method && req.method !== "GET" && req.method !== "HEAD"
                  ? req
                  : undefined,
              duplex: "half",
            } as RequestInit);

            const response = await handleAiHubRequest(request);
            res.statusCode = response.status;
            response.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });
            const buffer = Buffer.from(await response.arrayBuffer());
            res.end(buffer);
          });
          server.middlewares.use("/api/invite-email", async (req, res) => {
            const url = new URL(req.url || "/api/invite-email", "http://localhost");
            const request = new Request(url.toString(), {
              method: req.method,
              headers: req.headers as HeadersInit,
              body:
                req.method && req.method !== "GET" && req.method !== "HEAD"
                  ? req
                  : undefined,
              duplex: "half",
            } as RequestInit);

            const response = await handleInviteEmailRequest(request);
            res.statusCode = response.status;
            response.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });
            const buffer = Buffer.from(await response.arrayBuffer());
            res.end(buffer);
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

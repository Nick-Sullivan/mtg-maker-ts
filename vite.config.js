import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/mtg-maker-ts/",
  plugins: [
    react(),
    {
      name: "spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (
            req.url?.startsWith("/mtg-maker-ts") &&
            !req.url.includes(".") &&
            req.headers.accept?.includes("text/html")
          ) {
            req.url = "/mtg-maker-ts/";
          }
          next();
        });
      },
    },
  ],
});

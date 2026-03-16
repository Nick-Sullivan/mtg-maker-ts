import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/mtg-maker/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        proxy: resolve(__dirname, "proxy-maker.html"),
        compare: resolve(__dirname, "compare-decks.html"),
        showcase: resolve(__dirname, "deck-showcase.html"),
      },
    },
  },
});

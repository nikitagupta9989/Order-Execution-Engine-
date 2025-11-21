import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// helper to conditionally create replit plugins
async function replitPluginsIfDev() {
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    return [cartographer(), devBanner()];
  }
  return [];
}

export default defineConfig(async () => {
  const extra = await replitPluginsIfDev();

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...extra,
    ],
    resolve: {
      alias: {
        // aliases are relative to repo root; if you want them relative to client/src, adjust accordingly
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      // output inside the client folder so Vercel (when using client as project root) can detect it
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});

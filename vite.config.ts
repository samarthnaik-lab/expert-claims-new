import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "fs";

// Read package.json to get version
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const appVersion = packageJson.version || "0.0.0";
const buildTimestamp = Date.now().toString();

// Plugin to inject version and build timestamp as environment variables
function versionPlugin(): Plugin {
  return {
    name: 'version-plugin',
    config(config) {
      // Inject environment variables using define
      config.define = {
        ...config.define,
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
        'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(buildTimestamp),
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    versionPlugin(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable hash-based filenames for cache busting (Vite does this by default, but we're being explicit)
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
    // Generate source maps for production debugging (optional)
    sourcemap: false,
  },
  // Environment variables prefix
  envPrefix: 'VITE_',
}));

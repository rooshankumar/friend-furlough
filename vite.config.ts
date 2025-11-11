import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "0.0.0.0", // Allow access from Replit and external URLs
    port: 5000,
    strictPort: true,
    hmr: {
      clientPort: 5000
    },
    proxy: {
      // Optional: route API calls to Replit backend
      "/api": "https://5609853b-7353-4830-99d4-8810531cea64-00-3c52iz14wozfc.worf.replit.dev",
    },
  },

  preview: {
    port: 5000,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(), // Enables tagger only in dev
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Critical: ensure React isn't duplicated (important for dev hot reload)
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },

  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable source maps in production for smaller size
    
    rollupOptions: {
      output: {
        // Better caching via manual chunking
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // Keep all React-related packages together
            if (id.includes("react") || 
                id.includes("react-dom") || 
                id.includes("react/jsx-runtime") ||
                id.includes("scheduler")) {
              return "vendor-react";
            }
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("date-fns")) return "vendor-utils";
            return "vendor-other";
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    
    // Additional optimizations
    reportCompressedSize: true,
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "zustand",
      "date-fns",
      "lucide-react",
    ],
    exclude: ["@radix-ui/react-tooltip"], // Load on demand
  },

  ...(mode === "development" && {
    css: { devSourcemap: true },
  }),
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// import { createPerformancePlugin } from "./src/scripts/optimizePerformance";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: false,
    hmr: process.env.CODESPACES === 'true' 
      ? {
          // Client-side HMR configuration for Codespaces
          // Don't set port here - let it use the forwarded connection
          protocol: 'wss',
          host: process.env.CODESPACE_NAME + '-5000.app.github.dev'
        }
      : true, // Use default for local development
    proxy: {
      "/api": "https://5609853b-7353-4830-99d4-8810531cea64-00-3c52iz14wozfc.worf.replit.dev",
    },
  },

  preview: {
    port: 5000,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(), // Enables tagger only in dev
    // createPerformancePlugin(), // Performance optimizations - temporarily disabled
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
    sourcemap: false,
    
    // Mobile-first optimizations
    reportCompressedSize: true,
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    rollupOptions: {
      output: {
        // Optimize for mobile loading with vendor chunks
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge']
        },
        // Optimize chunk names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'chunk'
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        }
      }
    },

    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    }
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
    // Force all Radix UI packages to use the same React instance
    force: true,
  },

  ...(mode === "development" && {
    css: { devSourcemap: true },
  }),
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Critical: Ensure only ONE instance of React
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  build: {
    // Optimize build for performance
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks only - don't split app code to avoid circular dependencies
          if (id.includes('node_modules')) {
            // Keep React and React-DOM together in ONE chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            // Radix UI components in separate chunk
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            // Supabase in separate chunk
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Everything else in vendor
            return 'vendor';
          }
          // Let Vite handle app code splitting automatically
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Ensure proper module format
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'zustand',
      'date-fns',
      'lucide-react'
    ],
    // Exclude large dependencies that should be loaded on demand
    exclude: ['@radix-ui/react-tooltip']
  },
  // Enable source maps in development for better debugging
  ...(mode === 'development' && {
    css: {
      devSourcemap: true
    }
  })
}));

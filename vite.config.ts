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
  },
  build: {
    // Optimize build for performance
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['@radix-ui/react-avatar', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Feature chunks
          'chat-features': [
            './src/pages/ChatPage.tsx',
            './src/components/chat/OptimizedMessage.tsx',
            './src/components/chat/OptimizedConversationList.tsx',
            './src/stores/chatStore.ts'
          ],
          'profile-features': [
            './src/pages/ProfilePage.tsx',
            './src/pages/ExplorePage.tsx'
          ],
          'community-features': [
            './src/pages/CommunityPage.tsx',
            './src/pages/PostDetailPage.tsx'
          ]
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
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

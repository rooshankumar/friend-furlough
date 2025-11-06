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
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('react-router-dom')) return 'router-vendor';
            if (id.includes('@radix-ui')) return 'ui-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('@supabase/supabase-js')) return 'supabase-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('date-fns')) return 'date-vendor';
            return 'vendor';
          }
          
          // Split chat features into smaller chunks
          if (id.includes('src/pages/ChatPageV2')) return 'chat-page';
          if (id.includes('src/stores/chatStore')) return 'chat-store';
          if (id.includes('src/components/chat/')) return 'chat-components';
          
          // Profile features
          if (id.includes('src/pages/ProfilePage')) return 'profile-page';
          if (id.includes('src/pages/ExplorePage')) return 'explore-page';
          if (id.includes('src/components/profile/')) return 'profile-components';
          
          // Community features
          if (id.includes('src/pages/CommunityPage')) return 'community-page';
          if (id.includes('src/pages/PostDetailPage')) return 'post-detail';
          if (id.includes('src/components/community/')) return 'community-components';
          
          // Stores
          if (id.includes('src/stores/')) return 'stores';
          
          // Hooks
          if (id.includes('src/hooks/')) return 'hooks';
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

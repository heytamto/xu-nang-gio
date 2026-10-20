import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Tăng ngưỡng cảnh báo kích thước chunk lên 1000 kB (1 MB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Tách riêng React và các thư viện React lõi
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Tách riêng bộ icon Lucide (thường chiếm dung lượng lớn nhất)
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Các thư viện phụ thuộc còn lại trong node_modules
            return 'vendor-libs';
          }
        },
      },
    },
  },
})
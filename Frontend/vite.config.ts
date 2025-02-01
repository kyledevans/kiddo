import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteTsconfigPaths(), mkcert()],
  server: {
    open: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5106",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

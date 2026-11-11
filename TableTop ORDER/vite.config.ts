import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { middlewareMode: true },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          canvas: ["konva", "react-konva"],
          motion: ["motion/react"],
          react: ["react", "react-dom"],
          network: ["socket.io-client"],
        },
      },
    },
  },
});

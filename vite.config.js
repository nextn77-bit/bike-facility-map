import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/bike-facility-map/",
  server: {
    proxy: {
      "/api/proxy": {
        target: "http://api.data.go.kr",
        changeOrigin: true,
        secure: false,  // 이 줄 추가
        rewrite: (path) => path.replace(/^\/api\/proxy/, "/openapi/tn_pubr_public_bcycl_lend_api"),
      },
    },
  },
});
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/bike-facility-map/", // GitHub repo 이름으로 변경하세요
});

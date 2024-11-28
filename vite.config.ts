import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tsconfigPaths() as any,
    react(),
  ],
});
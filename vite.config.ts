import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd(), "");

  return {
    plugins: [
      react({
        jsxRuntime: "automatic",
      }),
      checker({
        typescript: {
          tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
        },
        overlay: false,
      }),
    ],
    define: {
      "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV),
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, "client/app.tsx"),
        name: "app",
        fileName: "app",
        formats: ["umd"],
      },
      emptyOutDir: false,
      outDir: path.resolve(__dirname, "public"),
      target: "es2020",
    },
    test: {
      include: [path.resolve(__dirname, "tests/**/*.test.{ts,tsx}")],
      globals: true,
      environment: "jsdom",
    },
  };
});

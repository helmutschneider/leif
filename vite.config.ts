import { defineConfig, loadEnv } from "vite";
import path from "path";
import child from "child_process";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

function phpServer(config) {
  let proc;

  return {
    name: "php-server",
    buildStart: (x) => {
      if (config.mode === "production") {
        return;
      }
      if (proc) {
        return;
      }
      proc = child.spawn('php', ['-S', 'localhost:8000', '-t', 'public'], {
        stdio: 'inherit',
      });
    },
  }
}

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
      phpServer(config),
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
      include: [path.resolve(__dirname, "client/**/*.test.{ts,tsx}")],
      globals: true,
      environment: "jsdom",
    },
  };
});

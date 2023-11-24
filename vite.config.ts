import { defineConfig } from "vite";
import { readdirSync, statSync } from "fs";
import { resolve, dirname, basename } from "path";

const buildFileList = (dirPath: string): Record<string, string> => {
  let list: Record<string, string> = {};

  readdirSync(dirPath).forEach((file) => {
    const path = resolve(dirPath, file);

    if (statSync(path).isDirectory()) {
      list = { ...list, ...buildFileList(path) };
    } else if (file.endsWith(".html")) {
      list[basename(dirname(path))] = path;
    }
  });

  return list;
};

export default defineConfig({
  root: "src/pages",
  base: "",
  publicDir: "../../public",
  resolve: {
    alias: [{ find: "@", replacement: resolve(__dirname, "src") }],
  },
  build: {
    target: "es2015",
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: buildFileList(resolve(__dirname, "src/pages")),
    },
  },
});

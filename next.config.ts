import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // 상위 7조/package-lock.json 때문에 Turbopack이 잘못된 워크스페이스 루트를
  // 고르면 frontend/node_modules(@tanstack/react-query 등)를 못 찾음
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;

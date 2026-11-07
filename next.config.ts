import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App 100% dinâmico e por usuário (sessão via cookie): o modelo de cache
  // clássico é suficiente e mais simples que Cache Components aqui.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb", // vídeos não passam pelo servidor
    },
  },
};

export default nextConfig;

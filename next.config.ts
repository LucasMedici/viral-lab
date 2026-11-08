import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App 100% dinâmico e por usuário (sessão via cookie): o modelo de cache
  // clássico é suficiente e mais simples que Cache Components aqui.
  // Indicador do modo dev no canto direito (não cobre o menu lateral).
  devIndicators: { position: "bottom-right" },
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
  // Não expõe "X-Powered-By: Next.js".
  poweredByHeader: false,
  // Cabeçalhos de segurança em todas as rotas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Impede que o app seja embutido em iframes de outros sites (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // Navegador não "adivinha" o tipo de arquivo.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Envia só a origem (sem caminho) ao abrir links externos.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // O app não usa câmera, microfone nem localização.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

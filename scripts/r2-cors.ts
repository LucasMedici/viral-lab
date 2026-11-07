/**
 * Aplica a política de CORS no bucket R2, permitindo que o navegador envie
 * (PUT) e leia (GET) arquivos via URLs assinadas a partir das origens do app.
 *
 * Uso: npm run r2:cors
 * Lê R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET e
 * R2_CORS_ORIGINS (separadas por vírgula) do .env.local.
 *
 * Observação: o token precisa de permissão "Admin Read & Write" para alterar CORS.
 * Se o seu token for só "Object Read & Write", cole o JSON impresso abaixo em
 * R2 › bucket › Settings › CORS Policy no painel da Cloudflare.
 */
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"] as const;
const missing = required.filter((k) => !process.env[k]);

const origins = (process.env.R2_CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const rules = [
  {
    AllowedOrigins: origins,
    AllowedMethods: ["GET", "PUT", "HEAD"],
    AllowedHeaders: ["content-type"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

console.log("Política de CORS (formato do painel da Cloudflare):");
console.log(JSON.stringify(rules, null, 2));

if (missing.length) {
  console.error(`\nFaltam variáveis: ${missing.join(", ")}. Preencha o .env.local ou cole o JSON acima no painel.`);
  process.exit(1);
}

const bucket = process.env.R2_BUCKET || "virallab";
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

try {
  await s3.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules: rules } }));
  const current = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log(`\nCORS aplicado no bucket "${bucket}":`);
  console.log(JSON.stringify(current.CORSRules, null, 2));
} catch (e) {
  console.error(`\nNão foi possível aplicar via API (${(e as Error).name}: ${(e as Error).message}).`);
  console.error("Cole o JSON acima em R2 › bucket › Settings › CORS Policy.");
  process.exit(1);
}

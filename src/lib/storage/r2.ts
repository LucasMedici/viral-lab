import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@/lib/env";
import type { StorageProvider } from "./types";

let client: S3Client | undefined;

function r2(): { s3: S3Client; bucket: string } {
  const env = serverEnv();
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      // R2 não suporta os checksums CRC32 que o SDK v3 passou a enviar por padrão
      // em URLs assinadas; desligar evita erros no PUT feito pelo navegador.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return { s3: client, bucket: env.R2_BUCKET };
}

function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export const r2Storage: StorageProvider = {
  async createUploadUrl({ key, contentType, size, expiresInSeconds = 15 * 60 }) {
    const { s3, bucket } = r2();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    const url = await getSignedUrl(s3, command, {
      expiresIn: expiresInSeconds,
      signableHeaders: new Set(["content-type", "content-length"]),
    });
    return { url, headers: { "Content-Type": contentType } };
  },

  async createPreviewUrl(key, expiresInSeconds = 60 * 60) {
    const { s3, bucket } = r2();
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  },

  async createDownloadUrl(key, fileName, expiresInSeconds = 10 * 60) {
    const { s3, bucket } = r2();
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: contentDisposition(fileName),
      }),
      { expiresIn: expiresInSeconds },
    );
  },

  async deleteObject(key) {
    const { s3, bucket } = r2();
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },

  async getBucketUsage() {
    const { s3, bucket } = r2();
    let bytes = 0;
    let objects = 0;
    let token: string | undefined;
    do {
      const page = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
      );
      for (const obj of page.Contents ?? []) {
        bytes += obj.Size ?? 0;
        objects += 1;
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return { bytes, objects };
  },
};

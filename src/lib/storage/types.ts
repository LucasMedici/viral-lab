/**
 * Contrato do storage de arquivos. O app só conversa com esta interface;
 * para trocar de provedor (S3, Backblaze B2, Supabase Storage…), crie outra
 * implementação e mude a exportação em ./index.ts.
 */
export interface StorageProvider {
  /** URL assinada para o navegador enviar o arquivo direto ao storage (HTTP PUT). */
  createUploadUrl(input: {
    key: string;
    contentType: string;
    size: number;
    expiresInSeconds?: number;
  }): Promise<{ url: string; headers: Record<string, string> }>;

  /** URL assinada de leitura (preview no <video>). */
  createPreviewUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /** URL assinada que força o download com o nome de arquivo informado. */
  createDownloadUrl(key: string, fileName: string, expiresInSeconds?: number): Promise<string>;

  /** Remove o objeto. Não falha se ele já não existir. */
  deleteObject(key: string): Promise<void>;

  /** Soma real do tamanho dos objetos no bucket (lista todos os objetos). */
  getBucketUsage(): Promise<{ bytes: number; objects: number }>;
}

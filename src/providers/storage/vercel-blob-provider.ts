/**
 * Vercel Blob storage provider.
 * Uses @vercel/blob for production image storage.
 * Set STORAGE_PROVIDER=vercel-blob and BLOB_READ_WRITE_TOKEN in env.
 */
import type { StorageObject, StorageProvider, StorageUploadInput } from "./types";

export class VercelBlobProvider implements StorageProvider {
  readonly name = "vercel-blob";

  getPublicUrl(key: string): string {
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    return `https://blob.vercel-storage.com/${key.replace(/^\/+/, "")}`;
  }

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    // Dynamically import to avoid build errors when token not set
    const { put } = await import("@vercel/blob");

    const body =
      typeof input.data === "string" || Buffer.isBuffer(input.data)
        ? input.data
        : Buffer.from(input.data);

    const blob = await put(input.key, body, {
      access: "public",
      contentType: input.contentType,
      addRandomSuffix: false,
    });

    return {
      key: input.key,
      url: blob.url,
      sizeBytes: typeof input.data === "string"
        ? Buffer.byteLength(input.data)
        : input.data.byteLength,
      contentType: input.contentType,
      provider: this.name,
    };
  }

  async delete(key: string): Promise<void> {
    const { del } = await import("@vercel/blob");
    await del(key);
  }
}

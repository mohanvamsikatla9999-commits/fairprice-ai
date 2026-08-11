import { promises as fs } from "fs";
import path from "path";
import { env } from "@/config/env";
import { sanitizeFilename } from "@/lib/security/sanitize";
import type { StorageObject, StorageProvider, StorageUploadInput } from "./types";

function toBuffer(data: Buffer | Uint8Array | string): Buffer {
  if (typeof data === "string") return Buffer.from(data);
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(data);
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private readonly root: string;
  private readonly publicBase: string;

  constructor(options?: { root?: string; publicBase?: string }) {
    this.root = path.resolve(options?.root ?? env.STORAGE_LOCAL_PATH);
    this.publicBase = (options?.publicBase ?? env.STORAGE_PUBLIC_URL).replace(/\/$/, "");
  }

  getPublicUrl(key: string): string {
    const clean = key.replace(/^\/+/, "");
    return `${this.publicBase}/${clean}`;
  }

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const safeKey = input.key
      .split("/")
      .map((part) => sanitizeFilename(part))
      .filter(Boolean)
      .join("/");

    if (!safeKey) {
      throw new Error("Invalid storage key");
    }

    const absolute = path.join(this.root, safeKey);
    const resolvedRoot = path.resolve(this.root);
    const resolvedFile = path.resolve(absolute);
    if (!resolvedFile.startsWith(resolvedRoot + path.sep) && resolvedFile !== resolvedRoot) {
      throw new Error("Invalid storage path");
    }

    await fs.mkdir(path.dirname(resolvedFile), { recursive: true });

    if (!input.overwrite) {
      try {
        await fs.access(resolvedFile);
        throw new Error(`Object already exists: ${safeKey}`);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Object already exists")) {
          throw error;
        }
      }
    }

    const buffer = toBuffer(input.data);
    await fs.writeFile(resolvedFile, buffer);

    return {
      key: safeKey,
      url: this.getPublicUrl(safeKey),
      sizeBytes: buffer.byteLength,
      contentType: input.contentType,
      provider: this.name,
    };
  }

  async delete(key: string): Promise<void> {
    const safeKey = key.replace(/^\/+/, "");
    const absolute = path.join(this.root, safeKey);
    try {
      await fs.unlink(absolute);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
    }
  }
}

import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import type { StorageObject, StorageProvider, StorageUploadInput } from "./types";

export class MockStorageProvider implements StorageProvider {
  readonly name = "mock";
  private readonly store = new Map<string, StorageObject>();

  getPublicUrl(key: string): string {
    return `https://mock.storage.local/${key.replace(/^\/+/, "")}`;
  }

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const key = input.key || `mock/${nanoid(12)}`;
    const size =
      typeof input.data === "string"
        ? Buffer.byteLength(input.data)
        : input.data.byteLength;

    const object: StorageObject = {
      key,
      url: this.getPublicUrl(key),
      sizeBytes: size,
      contentType: input.contentType,
      provider: this.name,
    };
    this.store.set(key, object);
    logger.info("Mock storage upload", { key, sizeBytes: size });
    return object;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

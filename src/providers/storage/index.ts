import { env } from "@/config/env";
import { LocalStorageProvider } from "./local-storage-provider";
import { MockStorageProvider } from "./mock-storage-provider";
import { VercelBlobProvider } from "./vercel-blob-provider";
import type { StorageProvider } from "./types";

export type { StorageObject, StorageProvider, StorageUploadInput } from "./types";
export { LocalStorageProvider } from "./local-storage-provider";
export { MockStorageProvider } from "./mock-storage-provider";
export { VercelBlobProvider } from "./vercel-blob-provider";

export function createStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case "vercel-blob":
      return new VercelBlobProvider();
    case "mock":
      return new MockStorageProvider();
    case "local":
    default:
      return new LocalStorageProvider();
  }
}

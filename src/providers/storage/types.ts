export type StorageUploadInput = {
  key: string;
  data: Buffer | Uint8Array | string;
  contentType?: string;
  overwrite?: boolean;
};

export type StorageObject = {
  key: string;
  url: string;
  sizeBytes: number;
  contentType?: string;
  provider: string;
};

export interface StorageProvider {
  readonly name: string;
  upload(input: StorageUploadInput): Promise<StorageObject>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

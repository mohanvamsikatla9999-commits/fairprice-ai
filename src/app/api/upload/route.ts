import { requireUser } from "@/lib/auth/middleware";
import { createStorageProvider } from "@/providers/storage";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";
import { ValidationError } from "@/lib/api/errors";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("file is required");
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new ValidationError("File must be under 8MB");
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      throw new ValidationError("Only JPEG, PNG, WebP, or GIF images allowed");
    }

    const ext = file.type.split("/")[1] ?? "bin";
    const key = `listings/${user.id}/${nanoid(12)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = createStorageProvider();
    const uploaded = await storage.upload({
      key,
      data: buffer,
      contentType: file.type,
    });

    return ok({
      file: {
        storageKey: uploaded.key,
        url: uploaded.url,
        mimeType: file.type,
        sizeBytes: uploaded.sizeBytes,
      },
    }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

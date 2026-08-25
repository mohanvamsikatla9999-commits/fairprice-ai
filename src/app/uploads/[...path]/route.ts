import { promises as fs } from "fs";
import path from "path";
import { env } from "@/config/env";
import { NextRequest, NextResponse } from "next/server";

// Serve uploaded files from local storage.
// Files are stored at STORAGE_LOCAL_PATH (./storage/uploads by default)
// and accessed via /uploads/[...path]

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: NextRequest, context: Ctx) {
  try {
    const { path: segments } = await context.params;

    // Prevent path traversal — each segment must not contain ".."
    for (const seg of segments) {
      if (seg.includes("..") || seg.includes("\0")) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const storageRoot = path.resolve(env.STORAGE_LOCAL_PATH);
    const filePath = path.resolve(path.join(storageRoot, ...segments));

    // Double-check resolved path is still inside storage root
    if (!filePath.startsWith(storageRoot + path.sep) && filePath !== storageRoot) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).replace(".", "").toLowerCase();
    const contentType = MIME_MAP[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 1 year in browser, revalidate in CDN
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "EISDIR") {
      return new NextResponse("Not Found", { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

import { put, del } from "@vercel/blob";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const ON_VERCEL = !!process.env.VERCEL;
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Uploads a file and returns its public URL.
 * Uses Vercel Blob in production (recommended — keeps large PDFs out of the repo/DB).
 * Falls back to local /public/uploads for local development without a Blob token.
 */
export async function uploadFile(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  if (USE_BLOB) {
    const blob = await put(filename, file, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  if (ON_VERCEL) {
    // Vercel's serverless filesystem is read-only outside /tmp — never attempt
    // the local-disk fallback there, since it always fails with a confusing
    // ENOENT error. Fail with a clear, actionable message instead.
    throw new Error(
      "BLOB_READ_WRITE_TOKEN سیٹ نہیں ہے۔ Vercel → Storage → Blob store کھول کر " +
        "\".env.local\" tab سے token کاپی کریں، Environment Variables میں " +
        "BLOB_READ_WRITE_TOKEN کے نام سے شامل کریں، پھر دوبارہ Redeploy کریں۔"
    );
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  await writeFile(path.join(LOCAL_UPLOAD_DIR, safeName), file);
  return `/uploads/${safeName}`;
}

export async function deleteFile(url: string): Promise<void> {
  if (USE_BLOB && url.includes("blob.vercel-storage.com")) {
    await del(url).catch(() => {});
    return;
  }
  if (url.startsWith("/uploads/")) {
    await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
  }
}

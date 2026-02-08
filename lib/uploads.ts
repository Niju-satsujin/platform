import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = sanitizeFileName(file.name || "proof.txt");
  const finalName = `${Date.now()}-${randomUUID()}-${safeName}`;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const absolutePath = path.join(UPLOAD_DIR, finalName);
  await writeFile(absolutePath, buffer);

  return `/uploads/${finalName}`;
}

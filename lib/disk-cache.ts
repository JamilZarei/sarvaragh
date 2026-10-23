import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Small persistent cache under `node_modules/.cache/ketabgard/` (ignored by the
 * dev file watcher, so writes never trigger reloads). It keeps Open Library
 * responses and cover images across server restarts, which makes local
 * development and self-hosting fast after the first visit.
 *
 * On read-only hosts (serverless) every operation silently becomes a no-op.
 */

const ROOT = process.env.KETABGARD_CACHE_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "node_modules", ".cache", "ketabgard");
let disabled = process.env.NODE_ENV === "test";

export function cacheFile(namespace: string, key: string, ext: string): string {
  const hash = crypto.createHash("sha1").update(key).digest("hex");
  return path.join(/*turbopackIgnore: true*/ ROOT, namespace, `${hash}${ext}`);
}

function write(file: string, data: string | Buffer) {
  if (disabled) return;
  try {
    fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(/*turbopackIgnore: true*/ tmp, data);
    fs.renameSync(/*turbopackIgnore: true*/ tmp, /*turbopackIgnore: true*/ file);
  } catch {
    disabled = true;
  }
}

/** Reads a JSON entry if it is younger than `maxAgeMs`. */
export function readJson<T>(namespace: string, key: string, maxAgeMs: number): T | undefined {
  if (disabled) return undefined;
  const file = cacheFile(namespace, key, ".json");
  try {
    const stat = fs.statSync(/*turbopackIgnore: true*/ file);
    if (Date.now() - stat.mtimeMs > maxAgeMs) return undefined;
    return JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export function writeJson(namespace: string, key: string, value: unknown) {
  write(cacheFile(namespace, key, ".json"), JSON.stringify(value));
}

export type StoredFile = { body: Buffer; type: string };

/** Binary entry with its content type stored next to it. */
export function readFile(namespace: string, key: string): StoredFile | undefined {
  if (disabled) return undefined;
  const file = cacheFile(namespace, key, ".bin");
  try {
    const body = fs.readFileSync(/*turbopackIgnore: true*/ file);
    const type = fs.readFileSync(/*turbopackIgnore: true*/ `${file}.type`, "utf8");
    return { body, type };
  } catch {
    return undefined;
  }
}

export function writeFile(namespace: string, key: string, value: StoredFile) {
  const file = cacheFile(namespace, key, ".bin");
  write(`${file}.type`, value.type);
  write(file, value.body);
}

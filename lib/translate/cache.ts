import fs from "node:fs";
import path from "node:path";

/**
 * Process-wide translation cache.
 *
 * Machine translation is slow and the free MyMemory quota is small, so every
 * result is kept in memory and, where the filesystem is writable (local dev,
 * self-hosting), persisted to `node_modules/.cache/ketabgard/translations.json`
 * across restarts. That folder is ignored by the dev file watcher; writing
 * inside the project tree would trigger endless dev reloads. Override with
 * TRANSLATION_CACHE_FILE. On read-only hosts persistence silently becomes a no-op.
 */

const MAX_ENTRIES = 20_000;
const FILE =
  process.env.TRANSLATION_CACHE_FILE ??
  path.join(process.cwd(), "node_modules", ".cache", "ketabgard", "translations.json");

let store: Map<string, string> | null = null;
let saveTimer: NodeJS.Timeout | null = null;
let persistDisabled = process.env.NODE_ENV === "test";

function load(): Map<string, string> {
  if (store) return store;
  store = new Map();
  if (persistDisabled) return store;
  try {
    const raw = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ FILE, "utf8")) as unknown;
    if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof v === "string" && v) store.set(k, v);
      }
    }
  } catch {
    /* first run or unreadable cache: start empty */
  }
  return store;
}

function scheduleSave() {
  if (persistDisabled || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      fs.writeFileSync(/*turbopackIgnore: true*/ tmp, JSON.stringify(Object.fromEntries(load())));
      fs.renameSync(/*turbopackIgnore: true*/ tmp, /*turbopackIgnore: true*/ FILE);
    } catch {
      persistDisabled = true; // read-only filesystem (e.g. serverless)
    }
  }, 1500);
  saveTimer.unref?.();
}

export function cacheGet(key: string): string | undefined {
  return load().get(key);
}

export function cacheSet(key: string, value: string) {
  const map = load();
  map.delete(key);
  map.set(key, value);
  if (map.size > MAX_ENTRIES) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
  scheduleSave();
}

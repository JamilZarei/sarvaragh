import { LANGUAGES } from "@/lib/constants";

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(["fa"], { type: "language", fallback: "none" });
} catch {
  displayNames = null;
}

/** Persian name for a MARC language code; falls back to the raw code. */
export function languageName(code: string): string {
  const known = LANGUAGES.find((l) => l.code === code);
  if (known) return known.label;
  try {
    const name = displayNames?.of(code);
    if (name && name.toLowerCase() !== code) return name;
  } catch {
    /* MARC bibliographic codes are not always valid BCP 47 tags */
  }
  return code.toUpperCase();
}

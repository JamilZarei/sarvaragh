import Anthropic from "@anthropic-ai/sdk";

/**
 * Optional high-quality translator. Enabled only when an Anthropic credential
 * is configured (ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN); otherwise the app
 * uses MyMemory. Claude knows the published Persian titles of well-known books
 * and transliterates names consistently.
 */

const MODEL = "claude-opus-5-5";

export type ClaudeKind = "title" | "name" | "subject" | "text" | "query";

const INSTRUCTIONS: Record<ClaudeKind, string> = {
  title:
    "These are book titles. Give the title of the published Persian edition when one is well known (e.g. Dune → تلماسه); otherwise translate the title naturally. Keep numbers and proper nouns recognizable.",
  name: "These are author names. Transliterate each name into Persian script using the conventional Persian spelling.",
  subject: "These are library subject headings. Translate each into a short Persian heading.",
  text: "These are book descriptions. Translate each faithfully into fluent, natural Persian. Do not summarize, add, or omit information.",
  query: "These are search queries typed in Persian. Translate each into the English words most likely to find the book in an English library catalog. Return only the query.",
};

let client: Anthropic | null = null;

export function claudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** Returns one translation per input (null where it failed). Never throws. */
export async function claudeTranslate(texts: string[], kind: ClaudeKind): Promise<(string | null)[]> {
  const empty = texts.map(() => null);
  if (!claudeAvailable() || texts.length === 0) return empty;
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Server-side fallback: if a safety classifier declines, Anthropic's recommended
      // fallback model answers instead of returning a refusal.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { translations: { type: "array", items: { type: "string" } } },
            required: ["translations"],
            additionalProperties: false,
          },
        },
      },
      system:
        "You translate book metadata for a Persian-language library website. " +
        `${INSTRUCTIONS[kind]} ` +
        "Return exactly one translation per input item, in the same order, in the `translations` array.",
      messages: [{ role: "user", content: JSON.stringify({ items: texts }) }],
    });

    if (response.stop_reason === "refusal") return empty;
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return empty;
    const parsed = JSON.parse(text.text) as { translations?: unknown };
    const list = Array.isArray(parsed.translations) ? parsed.translations : [];
    if (list.length !== texts.length) return empty;
    return list.map((t) => (typeof t === "string" && t.trim() ? t.trim() : null));
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.warn("[translate] Anthropic credential rejected; falling back to MyMemory.");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.warn("[translate] Anthropic rate limit reached; falling back to MyMemory.");
    } else if (error instanceof Anthropic.APIError) {
      console.warn(`[translate] Anthropic API error ${error.status}; falling back to MyMemory.`);
    }
    return empty;
  }
}

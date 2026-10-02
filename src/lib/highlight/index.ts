import { renderLines } from "./render";
import { tokenizeTypeScript } from "./tokenize";
import type { Token } from "./types";

const PLAIN_LANGUAGES = new Set(["text", "txt", "plain", "log", "output", "shell-output", "diff"]);

export { tokenizeTypeScript } from "./tokenize";
export type { Token, TokenKind } from "./types";

/**
 * Highlights a snippet into `.line` rows so the stylesheet can draw the gutter
 * counter itself, instead of shipping Shiki's per-theme inline styles with
 * every build.
 */
export function highlightCode(code: string, language: string): string {
  const normalized = language.toLowerCase().trim();
  const tokens: Token[] = PLAIN_LANGUAGES.has(normalized)
    ? [{ kind: "plain", value: code }]
    : tokenizeTypeScript(code);

  return renderLines(tokens);
}
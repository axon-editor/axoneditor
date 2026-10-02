import type { Token } from "./types";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

/**
 * Snippet text is authored in TypeScript data files, so every value is escaped
 * before it reaches markup. Nothing is trusted, including closing tags inside
 * a string literal.
 */
export const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);

export const renderToken = (token: Token) => {
  if (token.kind === "plain") return escapeHtml(token.value);
  return `<span class="tok-${token.kind}">${escapeHtml(token.value)}</span>`;
};

export const renderLines = (tokens: Token[]) => {
  const html = tokens.map(renderToken).join("");
  const lines = html.split("\n");
  const rows = lines.map((line) => `<span class="line">${line}</span>`).join("\n");

  return `<pre><code>${rows}</code></pre>`;
};
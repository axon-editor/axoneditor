import { push, type ScanContext } from "./context";
import { IDENT_PART } from "./chars";

/**
 * A `/` opens a regex literal only where an expression may begin. Scanning
 * backwards for the previous significant token answers that, which is what
 * keeps `a / b` from being swallowed as a pattern.
 */
export const isRegexPosition = (context: ScanContext) => {
  for (let index = context.tokens.length - 1; index >= 0; index -= 1) {
    const token = context.tokens[index];
    if (token.value.trim().length === 0) continue;

    if (token.kind === "number" || token.kind === "string" || token.kind === "comment") return false;
    if (token.kind === "property" || token.kind === "builtin" || token.kind === "type") return false;
    if (token.kind === "function" || token.kind === "tag") return false;
    if (token.kind === "control") return true;
    if (token.kind === "keyword") return token.value === "return" || token.value === "typeof";
    if (token.kind === "modifier") return false;

    // A bare identifier is a finished expression, so `/` divides rather than
    // opens a pattern. The same holds for a closed bracket or call.
    if (token.kind === "plain") return false;
    if (token.kind === "punctuation") return !/^[)\]}]$/.test(token.value);

    return true;
  }

  return true;
};

export const scanRegex = (context: ScanContext) => {
  const { code } = context;
  const start = context.index;
  context.index += 1;

  while (context.index < code.length) {
    const char = code[context.index];
    if (char === "\\") {
      context.index += 2;
      continue;
    }
    if (char === "\n") break;
    if (char === "/") {
      context.index += 1;
      break;
    }
    context.index += 1;
  }

  while (context.index < code.length && IDENT_PART.test(code[context.index])) context.index += 1;
  push(context, "string", code.slice(start, context.index));
};

const IDENT_PART_FALLBACK = /[A-Za-z0-9_$]/;
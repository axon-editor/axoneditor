import { push, type ScanContext } from "./context";
import { DIGIT, IDENT_START } from "./chars";
import { OPERATORS, PUNCTUATION } from "./keywords";
import { scanBlockComment, scanLineComment } from "./comments";
import { scanIdentifier } from "./identifiers";
import { looksLikeJsx, scanJsxTag } from "./jsx";
import { scanNumber } from "./numbers";
import { isRegexPosition, scanRegex } from "./regex";
import { scanStringOrTemplate } from "./strings";
import type { Token } from "./types";

const MULTI_CHAR_OPERATORS = [
  "===", "!==", ">>>", "**=", "...", "??=", "||=", "&&=",
  "==", "!=", "<=", ">=", "&&", "||", "=>", "??", "+=", "-=", "*=", "/=", "%=", "<<", ">>",
];

const isTrackedWhitespace = (char: string) => char === "\n" || char === "\r" || char === "\t" || char === "\f" || char === "\v" || char === " ";

export function tokenizeTypeScript(code: string): Token[] {
  const context: ScanContext = { code, index: 0, tokens: [] };

  while (context.index < code.length) {
    const char = code[context.index];
    const next = code[context.index + 1];

    if (isTrackedWhitespace(char)) {
      push(context, "plain", char);
      context.index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      scanLineComment(context);
      continue;
    }
    if (char === "/" && next === "*") {
      scanBlockComment(context);
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      scanStringOrTemplate(context);
      continue;
    }
    if (char === "<" && looksLikeJsx(code, context.index)) {
      scanJsxTag(context);
      continue;
    }
    if (char === "/" && isRegexPosition(context)) {
      scanRegex(context);
      continue;
    }
    if (DIGIT.test(char)) {
      scanNumber(context);
      continue;
    }
    if (IDENT_START.test(char)) {
      scanIdentifier(context);
      continue;
    }
    if (OPERATORS.has(char)) {
      const operator = MULTI_CHAR_OPERATORS.find((candidate) => code.startsWith(candidate, context.index));
      if (operator) {
        push(context, "operator", operator);
        context.index += operator.length;
        continue;
      }
      push(context, "operator", char);
      context.index += 1;
      continue;
    }
    if (PUNCTUATION.has(char)) {
      push(context, "punctuation", char);
      context.index += 1;
      continue;
    }

    push(context, "plain", char);
    context.index += 1;
  }

  return context.tokens;
}
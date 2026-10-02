import { push, type ScanContext } from "./context";
import { IDENT_PART, SPACE } from "./chars";
import { BUILTINS, CONTROL, KEYWORDS, MODIFIERS } from "./keywords";

/**
 * Identifiers are classified by position and shape rather than by a symbol
 * table: `.length` is a property, `.at()` is a call, `Renderer` is a type by
 * capitalization, and a bare lowercase word followed by `(` is a function.
 */
export const scanIdentifier = (context: ScanContext) => {
  const { code } = context;
  const start = context.index;
  while (context.index < code.length && IDENT_PART.test(code[context.index])) context.index += 1;
  const value = code.slice(start, context.index);

  let lookahead = context.index;
  while (lookahead < code.length && SPACE.test(code[lookahead])) lookahead += 1;

  const previous = context.tokens[context.tokens.length - 1];
  const afterDot = previous?.value === ".";

  if (afterDot) {
    push(context, code[lookahead] === "(" ? "function" : "property", value);
    return;
  }

  if (CONTROL.has(value)) {
    push(context, "control", value);
    return;
  }
  if (MODIFIERS.has(value)) {
    push(context, "modifier", value);
    return;
  }
  if (KEYWORDS.has(value)) {
    push(context, "keyword", value);
    return;
  }
  if (BUILTINS.has(value)) {
    push(context, "builtin", value);
    return;
  }
  if (/^[A-Z]/.test(value)) {
    push(context, "type", value);
    return;
  }
  if (code[lookahead] === "(") {
    push(context, "function", value);
    return;
  }

  push(context, "plain", value);
};
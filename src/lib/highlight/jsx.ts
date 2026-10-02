import { push, spliceTokens, type ScanContext } from "./context";
import { tokenizeTypeScript } from "./tokenize";

const TAG_NAME = /[A-Za-z][\w.-]*/y;

/**
 * JSX only exists in the `.tsx` snippets we highlight, so a `<` followed by a
 * plausible tag name is enough of a signal. Type assertions such as `as Foo`
 * use different punctuation and never reach this branch.
 */
export const scanJsxTag = (context: ScanContext) => {
  const { code } = context;
  const tagStart = context.index;
  context.index += 1;

  TAG_NAME.lastIndex = context.index;
  const name = TAG_NAME.exec(code)?.[0];
  if (name) context.index += name.length;
  push(context, "tag", code.slice(tagStart, context.index));

  while (context.index < code.length && code[context.index] !== ">") {
    const char = code[context.index];

    if (char === "{") {
      const expressionStart = context.index + 1;
      context.index += 1;

      let depth = 1;
      while (context.index < code.length && depth > 0) {
        if (code[context.index] === "{") depth += 1;
        if (code[context.index] === "}") depth -= 1;
        if (depth === 0) break;
        context.index += 1;
      }

      const expression = code.slice(expressionStart, context.index);
      context.index += 1;

      spliceTokens(context, tokenizeTypeScript(expression));
      continue;
    }

    if (char === '"' || char === "'") {
      const stringStart = context.index;
      context.index += 1;
      while (context.index < code.length && code[context.index] !== char) context.index += 1;
      context.index += 1;
      push(context, "string", code.slice(stringStart, context.index));
      continue;
    }

    if (char === "=") {
      push(context, "operator", "=");
      context.index += 1;
      continue;
    }

    const attributeStart = context.index;
    while (context.index < code.length && (/[\w-]/.test(code[context.index]))) context.index += 1;

    if (context.index === attributeStart) {
      push(context, "punctuation", char);
      context.index += 1;
      continue;
    }

    push(context, "property", code.slice(attributeStart, context.index));
  }

  push(context, "punctuation", code[context.index] ?? ">");
  context.index += 1;
};

/**
 * Cheap pre-check so `<` in `a < b` never starts a JSX scan. The preceding
 * character also has to be a boundary, which is what keeps the `Bar` half of a
 * generic like `Foo<Bar>` out of this branch.
 */
export const looksLikeJsx = (code: string, index: number) => {
  if (!/^<[/]?[A-Za-z]/.test(code.slice(index))) return false;

  const previous = code[index - 1];
  if (previous === undefined) return true;
  return !/[\w$>]/.test(previous);
};
import { push, spliceTokens, type ScanContext } from "./context";
import { tokenizeTypeScript } from "./tokenize";

const scanString = (context: ScanContext, quote: string) => {
  const { code } = context;
  let emitted = context.index;
  context.index += 1;

  while (context.index < code.length) {
    const char = code[context.index];

    if (char === "\\") {
      push(context, "string", code.slice(emitted, context.index));
      push(context, "escape", code.slice(context.index, context.index + 2));
      context.index += 2;
      emitted = context.index;
      continue;
    }
    if (char === quote) {
      context.index += 1;
      break;
    }
    if (char === "\n") break;

    context.index += 1;
  }

  push(context, "string", code.slice(emitted, context.index));
};

const scanTemplate = (context: ScanContext) => {
  const { code } = context;
  let emitted = context.index;
  context.index += 1;

  while (context.index < code.length) {
    const char = code[context.index];

    if (char === "\\") {
      push(context, "string", code.slice(emitted, context.index));
      push(context, "escape", code.slice(context.index, context.index + 2));
      context.index += 2;
      emitted = context.index;
      continue;
    }
    if (char === "`") {
      context.index += 1;
      break;
    }
    if (char === "$" && code[context.index + 1] === "{") {
      push(context, "string", code.slice(emitted, context.index));
      push(context, "punctuation", "${");
      context.index += 2;

      const expressionStart = context.index;
      let depth = 1;
      while (context.index < code.length) {
        const inner = code[context.index];
        if (inner === "{") depth += 1;
        if (inner === "}") depth -= 1;
        if (depth === 0) break;
        context.index += 1;
      }

      const expression = code.slice(expressionStart, context.index);
      context.index += 1;

      spliceTokens(context, tokenizeTypeScript(expression));
      push(context, "punctuation", "}");
      emitted = context.index;
      continue;
    }

    context.index += 1;
  }

  push(context, "string", code.slice(emitted, context.index));
};

export const scanStringOrTemplate = (context: ScanContext) => {
  const char = context.code[context.index];
  if (char === "`") {
    scanTemplate(context);
    return;
  }
  scanString(context, char);
};
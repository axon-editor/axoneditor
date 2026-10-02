import { push, type ScanContext } from "./context";

export const scanLineComment = (context: ScanContext) => {
  const { code } = context;
  const start = context.index;
  while (context.index < code.length && code[context.index] !== "\n") context.index += 1;
  push(context, "comment", code.slice(start, context.index));
};

export const scanBlockComment = (context: ScanContext) => {
  const { code } = context;
  const start = context.index;
  context.index += 2;

  while (context.index < code.length) {
    if (code[context.index] === "*" && code[context.index + 1] === "/") {
      context.index += 2;
      break;
    }
    context.index += 1;
  }

  push(context, "comment", code.slice(start, context.index));
};
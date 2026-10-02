import { push, type ScanContext } from "./context";
import { DIGIT } from "./chars";

export const scanNumber = (context: ScanContext) => {
  const { code } = context;
  const start = context.index;

  if (code[context.index] === "0" && /[xXbBoO]/.test(code[context.index + 1] ?? "")) {
    context.index += 2;
    while (context.index < code.length && /[0-9a-fA-F_]/.test(code[context.index])) context.index += 1;
    push(context, "number", code.slice(start, context.index));
    return;
  }

  while (context.index < code.length && /[0-9_]/.test(code[context.index])) context.index += 1;

  if (code[context.index] === "." && DIGIT.test(code[context.index + 1] ?? "")) {
    context.index += 1;
    while (context.index < code.length && /[0-9_]/.test(code[context.index])) context.index += 1;
  }

  if (/[eE]/.test(code[context.index] ?? "")) {
    context.index += 1;
    if (/[+-]/.test(code[context.index] ?? "")) context.index += 1;
    while (context.index < code.length && DIGIT.test(code[context.index])) context.index += 1;
  }

  push(context, "number", code.slice(start, context.index));
};
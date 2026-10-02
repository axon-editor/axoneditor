import type { Token, TokenKind } from "./types";

export interface ScanContext {
  code: string;
  index: number;
  tokens: Token[];
}

export const push = (context: ScanContext, kind: TokenKind, value: string) => {
  if (value.length === 0) return;
  context.tokens.push({ kind, value });
};

/**
 * Recurses through the emitted tokens so template literal holes and JSX
 * expressions are highlighted by the same scanner as top level code.
 */
export const spliceTokens = (context: ScanContext, tokens: Token[]) => {
  context.tokens.push(...tokens);
};
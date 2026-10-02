export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "escape"
  | "number"
  | "keyword"
  | "control"
  | "modifier"
  | "builtin"
  | "type"
  | "function"
  | "property"
  | "operator"
  | "punctuation"
  | "tag";

export interface Token {
  kind: TokenKind;
  value: string;
}
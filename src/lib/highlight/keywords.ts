export const KEYWORDS = new Set([
  "as", "async", "await", "break", "case", "catch", "const", "continue", "debugger", "default",
  "delete", "do", "else", "enum", "export", "extends", "finally", "for", "from", "function",
  "get", "if", "implements", "import", "in", "instanceof", "interface", "let", "new", "of",
  "package", "private", "protected", "public", "readonly", "return", "satisfies", "set",
  "static", "switch", "throw", "try", "type", "typeof", "var", "void", "while", "yield", "declare",
]);

export const CONTROL = new Set([
  "if", "else", "for", "while", "switch", "case", "return", "try", "catch", "finally", "throw",
  "break", "continue", "do", "yield", "await",
]);

export const MODIFIERS = new Set([
  "public", "private", "protected", "readonly", "static", "abstract", "override", "async",
  "declare", "const",
]);

export const BUILTINS = new Set([
  "Array", "Boolean", "Date", "Error", "Map", "Math", "Number", "Object", "Promise", "RegExp",
  "Set", "String", "Symbol", "WeakMap", "WeakSet", "console", "document", "false", "globalThis",
  "Infinity", "JSON", "NaN", "null", "process", "undefined", "unknown", "never", "window",
]);

export const OPERATORS = new Set([
  "+", "-", "*", "/", "%", "**", "=", "==", "===", "!=", "!==", "<", ">", "<=", ">=", "&&", "||",
  "!", "?", "??", ":", ";", ",", ".", "=>", "...", "+=", "-=", "*=", "/=", "%=", "|", "&", "^",
  "~", "<<", ">>", ">>>", "??=", "||=", "&&=", "@",
]);

export const PUNCTUATION = new Set(["{", "}", "[", "]", "(", ")"]);
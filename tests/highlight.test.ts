import assert from "node:assert/strict";
import test from "node:test";

import { highlightCode, tokenizeTypeScript } from "../src/lib/highlight/index";

const stripMarkup = (html: string) => html
  .replace(/^<pre><code>/, "")
  .replace(/<\/code><\/pre>$/, "")
  .replace(/<span class="line">/g, "")
  .replace(/<\/span>(?=\n)/g, "")
  .replace(/<\/?span[^>]*>/g, "")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&");

const roundTrip = (code: string, language: string) => stripMarkup(highlightCode(code, language));

test("preserves source text exactly", () => {
  const samples: Array<[string, string]> = [
    ["ts", "// comment\nimport type { Session } from \"./session\";\nexport const a = 1;"],
    ["ts", "const ids = [0x1f, 42, 1_000, .5e3];\nconst ratio = 10 / 2 / 1;"],
    ["ts", "const s = \"say \\\"hi\\\"\";\nconst t = `a\\`b`;"],
    ["ts", "const log = `disposing ${ids.length} ${pattern}`;"],
    ["ts", "const el = <div className=\"box\">text</div>;"],
    ["typescript", "function pick<T>(items: T[]): T | undefined {\n  return items?.at(-1) ?? null;\n}"],
    ["text", "Renderer not found\n  at RpcClient.request (/src/rpc.ts:88:12)"],
    ["ts", ""],
    ["ts", "\n\n"],
  ];

  for (const [language, code] of samples) {
    assert.equal(roundTrip(code, language), code, `round trip failed for ${language}`);
  }
});

test("escapes markup so snippets cannot inject nodes", () => {
  const html = highlightCode('const evil = "<script>alert(1)</script>";', "ts");
  assert.equal(html.includes("<script"), false);
  assert.equal(html.includes("&lt;script&gt;"), true);
});

test("assigns every token kind used by the palette", () => {
  const source = `// note
export class Renderer implements Disposable {
  private readonly rpc = new Rpc("host");
  static version = "1.2.3";

  async dispose(): Promise<void> {
    const ids = [42];
    const pattern = /ab+c/gi;
    if (!this.disposed && ids.length > 0) {
      console.log(\`disposing \${ids.length}\`);
    }
  }
}`;

  const html = highlightCode(source, "ts");
  const kinds = ["comment", "string", "number", "keyword", "control", "modifier", "builtin", "type", "function", "property", "operator", "punctuation"];

  for (const kind of kinds) {
    assert.equal(html.includes(`tok-${kind}`), true, `missing tok-${kind}`);
  }
});

test("marks escapes separately from strings", () => {
  assert.equal(highlightCode('const s = "a\\"b";', "ts").includes("tok-escape"), true);
});

test("keeps regex literals distinct from division", () => {
  const html = highlightCode("const p = /ab+c/gi;\nconst q = total / count;", "ts");
  assert.equal(html.includes(`<span class="tok-string">/ab+c/gi</span>`), true);
  assert.equal(html.includes(`<span class="tok-operator">/</span>`), true);
});

test("highlights jsx tags and attributes", () => {
  const html = highlightCode('const el = <div className="box">text</div>;', "typescript");
  assert.equal(html.includes("tok-tag"), true);
  assert.equal(html.includes("tok-property"), true);
});

test("treats text languages as unstyled", () => {
  const html = highlightCode('const x = "not code";', "text");
  assert.equal(html.includes("tok-"), false);
});

test("token stream preserves every character", () => {
  const source = "const value = `a${b}c`; // end\n";
  const value = tokenizeTypeScript(source).map((token) => token.value).join("");
  assert.equal(value, source);
});
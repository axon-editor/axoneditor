import type { BlogPost } from "./blog";

export const rendererMemoryLeaksBlogPost: BlogPost = {
  slug: "how-we-plugged-axons-renderer-memory-leaks",
  title: "How We Plugged Axon's Renderer Memory Leaks",
  animatedTitles: [
    "How We Plugged Axon's Renderer Memory Leaks",
    "Nothing Crashed. Memory Only Ever Grew.",
    "Trimming on Insert Is Not the Same as Evicting on Dispose",
    "The Allocation That Was Not a Leak at All",
  ],
  excerpt:
    "Axon's renderer climbed a few hundred megabytes over a full working day without ever crashing. This is the story of three module-level caches that outlived their values, and why the fix had to start one layer above Monaco.",
  authors: [
    {
      name: "Gorden Archer",
      role: "Creator of Axon",
      avatar: "https://github.com/GordenArcher.png?size=96",
      github: "https://github.com/GordenArcher",
    },
  ],
  publishedAt: "2026-09-24",
  updatedAt: "2026-09-24",
  readingTime: "18 min read",
  tags: ["Memory", "Performance", "Architecture", "Monaco", "LSP", "Reliability"],
  coverImage: "/media/screenshots/captures/axon-capture-19.png",
  conclusion:
    "Axon's renderer stopped climbing because all three leaks shared one root cause: a Map keyed by something that outlives the object it caches. Semantic tokens are now evicted on model disposal, the Git blame cache is a bounded LRU, and the 200k-line terminal scrollback is documented as the deliberate allocation it is. The general lesson is that a cache's eviction condition must be an event, not a side effect. Trimming on insert only works while inserts keep arriving, and memory leaks that hide from short tests need bound or lifecycle assertions to stay fixed.",
  sections: [
    {
      kind: "paragraph",
      body: "Leave Axon open for a full working day. Open files, close files, hover over a few Git-tracked files, keep a test terminal running. The renderer's resident memory keeps climbing even though you have not done anything new in hours.",
      hoverPhrases: [
        {
          text: "keeps climbing even though you have not done anything new in hours",
          note: "This is the shape of a long-session leak. No crash, no error, no spike tied to an action. The only symptom is a number that only moves in one direction.",
        },
      ],
    },
    {
      kind: "paragraph",
      body: "This is the hardest class of memory bug to catch and the easiest to justify away. You can always account for the next hundred megabytes. You just opened a large file. You just let a language server finish indexing. But memory hygiene is not about whether you can explain each allocation. It is about whether the total ever returns to a floor.",
    },
    {
      kind: "callout",
      tone: "warning",
      title: "The symptom that hides from tests",
      body: "Nothing in this profile fails a unit test. The cache is correct on every call, the promise deduplication works, and the map returns the right value every time. The bug is entirely in time, and a short test session never runs long enough to see it.",
    },
    {
      kind: "heading",
      kicker: "Symptoms",
      title: "Three ways you can watch it happen",
    },
    {
      kind: "timeline",
      items: [
        {
          label: "Over hours",
          title: "Renderer RSS grows monotonically",
          body: "The steady climb never plateaus and never returns to baseline, regardless of whether you are actively editing or sitting idle.",
        },
        {
          label: "On close",
          title: "Closing a tab does not return its memory",
          body: "Closing a file frees its visible model, but the cached highlight snapshot for that file stays pinned. The tab is gone; its cost is not.",
        },
        {
          label: "On hover",
          title: "Git line-trace grows the heap without opening anything",
          body: "Moving the cursor across repository files fetches blame for each one. Every result is retained, so memory climbs even though you never kept a single one of those files open.",
        },
      ],
    },
    {
      kind: "paragraph",
      body: "All three trace back to the same structure: module-level Maps that live for the entire renderer process, keyed by something that outlives the value they hold. A Map at module scope with a string key is not a cache with a policy. It is a leak with a lookup table.",
    },
    {
      kind: "heading",
      kicker: "Leak 1",
      title: "The semantic-token cache pinned whole-file snapshots for closed files",
    },
    {
      kind: "paragraph",
      body: "For every model version the editor paints, Axon races a TextMate grammar tokenization against the language server's semantic-token reply and stores the merged result. The key is URI plus version.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/services/lsp/renderer/lspSemanticTokens.ts",
      code: `function getSemanticTokenCacheKey(model: monaco.editor.ITextModel) {
  return \`\${model.uri.toString()}::\${model.getVersionId()}\`;
}`,
    },
    {
      kind: "paragraph",
      body: "The stored value is a HighlightTokenSet, which is a complete decoded token stream for the entire buffer. On a few-thousand-line file that is comfortably hundreds of kilobytes. On a large source file it is megabytes. One entry is not a problem. The problem is how long entries live.",
      hoverPhrases: [
        {
          text: "a complete decoded token stream for the entire buffer",
          note: "This is why the fix could not just reduce entry count. The cache unit is the whole file, so the only real lever is how many files are pinned at once.",
        },
      ],
    },
    {
      kind: "paragraph",
      body: "The cache had an insert-time trim. When the map passed eighty entries, it dropped the oldest twenty. That bounds the map while you keep writing to it, which sounds like a policy and is not one.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/services/lsp/renderer/lspSemanticTokens.ts",
      code: `semanticTokenCache.set(cacheKey, { versionId, promise });
if (semanticTokenCache.size > 80) {
  const staleKeys = Array.from(semanticTokenCache.keys()).slice(0, 20);
  staleKeys.forEach((key) => semanticTokenCache.delete(key));
}`,
    },
    {
      kind: "paragraph",
      body: "The moment you stop painting new model versions, nothing runs the trim again. Close every file, go read something else, and the trim never fires for the rest of the session.",
      hoverPhrases: [
        {
          text: "the moment you stop painting new model versions, nothing runs the trim again",
          note: "The bound was attached to the wrong event. Inserting was the trigger for the leak's growth, not the trigger for its release.",
        },
      ],
    },
    {
      kind: "paragraph",
      body: "Worse, closing a file did not remove its entries at all. The key is the model URI, and a closed file's model keeps its URI. The last eighty whole-file snapshots stayed pinned for the life of the renderer process. And because a module-level Map can be retained by an old module graph, the pins could survive hot module reloads too, which is why memory sometimes appeared to reset in development and then climbed back.",
    },
    {
      kind: "callout",
      tone: "info",
      title: "Why the insert-time trim was a band-aid",
      body: "Insert-time trimming only works while the leak's own trigger is active. The real trigger for release is disposal, and disposal never called back into this cache. The bound ran during the wrong lifetime.",
    },
    {
      kind: "heading",
      kicker: "Leak 2",
      title: "The Git blame cache grew with every file you ever hovered",
    },
    {
      kind: "paragraph",
      body: "Line-trace is on by default. It fetches blame for whatever file the cursor lands in and caches the promise, which is a genuinely good idea for deduplicating concurrent requests. The problem is that the cache had no size bound whatsoever.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/renderer/features/editor/lib/git/useGitLineTrace.ts",
      code: `const blameCache = new Map<string, Promise<GitBlameResult>>();`,
    },
    {
      kind: "paragraph",
      body: "A GitBlameResult carries a record per line: commit hash, author, date, plus a map of full commit bodies keyed by hash. That is hundreds of bytes per line, so a large file's blame result scales from hundreds of kilobytes into megabytes.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/renderer/features/editor/lib/git/useGitLineTrace.ts",
      code: `const pending =
  blameCache.get(key) ?? window.axon.getGitBlame(folderPath, filePath);
blameCache.set(key, pending);`,
    },
    {
      kind: "paragraph",
      body: "Every repository file your cursor visited across a day got an entry that was never evicted. Twenty files hovered, twenty blame results retained forever. Unlike the semantic-token cache, this one was never even nominally bounded.",
    },
    {
      kind: "heading",
      kicker: "Not a leak",
      title: "Terminal scrollback is the deliberate large allocation",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/platform/terminal/terminalProtocol.ts",
      code: `export const TERMINAL_SCROLLBACK_LINES = 200_000;`,
    },
    {
      kind: "paragraph",
      body: "Every agent and test tab retains up to a 200,000-line xterm scrollback buffer. That is the largest single retained allocation per tab, and it is not a bug. Long AI and TUI sessions have to keep their scrollback for inspection after a run, so this is a product decision.",
    },
    {
      kind: "paragraph",
      body: "We did not change it. We documented it in the commit instead, so the next person who profiles a big heap per terminal tab finds the number already explained rather than spending an afternoon discovering it is intentional. Knowing which large allocation is deliberate is half of memory hygiene.",
      hoverPhrases: [
        {
          text: "knowing which large allocation is deliberate is half of memory hygiene",
          note: "A 200k-line buffer looks exactly like a leak in a heap snapshot until somebody says otherwise. The ambiguity, not the memory, is the real cost.",
        },
      ],
    },
    {
      kind: "heading",
      kicker: "The obvious fix",
      title: "Why Monaco's own dispose events were not enough",
    },
    {
      kind: "paragraph",
      body: "For Leak 1 the obvious move is to hook Monaco's model onDidDispose. That does not work in Axon, because Axon's buffer engine is not Monaco. It owns document identity and lifecycle with its own LRU budget.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/renderer/features/editor/lib/buffer/monacoModels.ts",
      code: `const RETAINED_BUFFER_BUDGET = 64 * 1024 * 1024; // 64 MB retained
const RETAINED_BUFFER_LIMIT = 48;                 // or 48 models
const RETAINED_SINGLE_BUFFER_LIMIT = 32 * 1024 * 1024; // single >32MB: no retain`,
    },
    {
      kind: "paragraph",
      body: "Clean, referenced-zero models are retained for instant reopen and evicted least-recently-used when the budget is exceeded. disposeBuffer does dispose the underlying ITextModel. The problem is that models also die when they simply leave the LRU budget, without Monaco's own dispose events firing on every path.",
    },
    {
      kind: "paragraph",
      body: "So relying on Monaco alone would miss exactly the evictions we most need to handle: the LRU ones, which are precisely the closed files whose snapshots we want dropped.",
      hoverPhrases: [
        {
          text: "exactly the evictions we most need to handle",
          note: "This is the architectural hinge of the whole fix. The cache sits below the component that knows when a model is dead, so disposal has to be broadcast upward.",
        },
      ],
    },
    {
      kind: "callout",
      tone: "info",
      title: "One layer up",
      body: "The buffer engine already knows the exact moment a model stops being reachable. That is the only component that can announce it, so the fix starts there instead of asking Monaco to report for a lifecycle it does not own.",
    },
    {
      kind: "heading",
      kicker: "The fix",
      title: "A dispose-broadcast registry in the buffer engine",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/renderer/features/editor/lib/buffer/monacoModels.ts",
      code: `const modelDisposeListeners = new Set<(uri: string) => void>();

export function addModelDisposeListener(listener: (uri: string) => void): {
  dispose: () => void;
} {
  modelDisposeListeners.add(listener);
  return {
    dispose: () => {
      modelDisposeListeners.delete(listener);
    },
  };
}`,
    },
    {
      kind: "paragraph",
      body: "Set rather than Map, because listeners are unique by function identity. The API returns a disposer so consumers can unsubscribe, mirroring Monaco's own disposable pattern rather than inventing a new convention.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/renderer/features/editor/lib/buffer/monacoModels.ts",
      code: `function disposeBuffer(filePath: string, expected: AxonBufferEntry) {
  if (buffers.get(filePath) !== expected || expected.references > 0) return;
  cancelDisposal(filePath);
  modelDisposeListeners.forEach((listener) =>
    listener(expected.model.uri.toString()),
  );
  if (!expected.model.isDisposed()) expected.model.dispose();
  buffers.delete(filePath);
}`,
    },
    {
      kind: "paragraph",
      body: "The broadcast fires before the model is disposed. The URI is derived from the model, so doing it first keeps the broadcast valid even if a listener inspects the model during teardown. And every eviction path funnels through this one function: the delayed five-hundred-millisecond disposal, the LRU trim, and the oversized and dirty-buffer paths. One call site means no eviction path can forget it.",
      hoverPhrases: [
        {
          text: "every eviction path funnels through this one function",
          note: "This is why a leak fix like this is durable. The alternative is auditing every exit path every time someone adds one.",
        },
      ],
    },
    {
      kind: "heading",
      kicker: "Fix 2",
      title: "Evicting semantic tokens on model disposal",
    },
    {
      kind: "paragraph",
      body: "Because the keys are URI plus version, discarding every entry for a disposed URI is a single prefix scan.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/services/lsp/renderer/lspSemanticTokens.ts",
      code: `function discardSemanticTokensForModel(uri: string) {
  const prefix = \`\${uri}::\`;
  for (const key of semanticTokenCache.keys()) {
    if (key.startsWith(prefix)) semanticTokenCache.delete(key);
  }
}
addModelDisposeListener(discardSemanticTokensForModel);`,
    },
    {
      kind: "paragraph",
      body: "A closed file's whole-file snapshots become garbage the moment the buffer can no longer be shown, which is the only moment they can safely be dropped. An open file's snapshots have to stay for repaint.",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/services/lsp/renderer/lspSemanticTokens.ts",
      code: `semanticTokenCache.set(cacheKey, { versionId, promise });
if (semanticTokenCache.size > 80) {
  const staleKeys = Array.from(semanticTokenCache.keys()).slice(0, 20);
  staleKeys.forEach((key) => semanticTokenCache.delete(key));
}`,
    },
    {
      kind: "paragraph",
      body: "The insert-time trim stays as a secondary safety net for pathological hot-loop painting, but it is no longer the primary retention mechanism. There is a difference between two independent protections and one protection that happens to cover two cases.",
      hoverPhrases: [
        {
          text: "no longer the primary retention mechanism",
          note: "Keeping it is fine. Believing it is load-bearing is not.",
        },
      ],
    },
    {
      kind: "paragraph",
      body: "The prefix scan also clears every version of a URI at once, not just the last one. A URI accrues a version entry per edit while it is open, so a file edited forty times had forty entries and disposal clears all of them.",
    },
    {
      kind: "heading",
      kicker: "Fix 3",
      title: "Capping the Git blame cache as an LRU",
    },
    {
      kind: "code",
      language: "typescript",
      filename: "apps/editor/src/renderer/features/editor/lib/git/useGitLineTrace.ts",
      code: `const BLAME_CACHE_MAX_ENTRIES = 256;

function cacheBlame(key: string, pending: Promise<GitBlameResult>) {
  blameCache.delete(key);
  blameCache.set(key, pending);
  while (blameCache.size > BLAME_CACHE_MAX_ENTRIES) {
    const oldestKey = blameCache.keys().next().value as string | undefined;
    if (oldestKey === undefined) break;
    blameCache.delete(oldestKey);
  }
}`,
    },
    {
      kind: "paragraph",
      body: "Delete then set exploits the Map insertion-order guarantee. The key moves to the back, so keys().next() is always the least recently used entry. That is complete LRU semantics with no library, no timestamps, and no order-preservation polyfill.",
      hoverPhrases: [
        {
          text: "delete then set exploits the Map insertion-order guarantee",
          note: "Insertion order is the whole mechanism. Removing the delete would turn this into a plain FIFO and quietly break the recency behaviour.",
        },
      ],
    },
    {
      kind: "paragraph",
      body: "Two hundred fifty-six entries keeps a realistic session's working set hot while bounding the worst case. Even if every entry were a multi-megabyte blame result, the cap makes the ceiling known and finite instead of everything you ever hovered.",
    },
    {
      kind: "paragraph",
      body: "A revisited file re-issues its blame request and moves to the back. That is a deliberate trade: a rare re-fetch for evicted files in exchange for not permanently retaining megabytes. Failed blames are still deleted immediately in the catch path, so a transient Git error does not poison the LRU with a rejected promise.",
    },
    {
      kind: "callout",
      tone: "success",
      title: "What stayed deliberately large",
      body: "Terminal scrollback remains 200,000 lines, and the commit body now names it explicitly as the largest single retained allocation per agent and test tab, so a future profiling session can distinguish intentional scrollback residency from accidental leakage.",
    },
    {
      kind: "heading",
      kicker: "The pattern",
      title: "Why all three survived review",
    },
    {
      kind: "paragraph",
      body: "None of these look like bugs in isolation. Each is an unbounded or lifecycle-blind Map keyed by something that outlives the value it holds.",
    },
    {
      kind: "mermaid",
      title: "The lifetimes that did not line up",
      diagram: `flowchart TD
  subgraph Leaks["The three leaks"]
    ST["Semantic tokens<br/>bounded by inserts"]
    BL["Git blame<br/>bounded by nothing"]
    SB["Terminal scrollback<br/>not a leak at all"]
  end

  subgraph Events["The events that should release them"]
    E1["Model disposal"]
    E2["LRU eviction"]
    E3["A deliberate product decision"]
  end

  ST -.->|"wrong event"| E1
  BL -.->|"missing bound"| E2
  SB -->|"documented"| E3`,
    },
    {
      kind: "paragraph",
      body: "Semantic tokens were bounded by one lifetime and invalidated by another. The bound ran during the wrong lifetime. The blame cache was bounded by nothing, was correct and fast on every call, and its only failure mode was time, which no single-session test catches. And scrollback is not a leak, but without documentation it is indistinguishable from one in a heap snapshot.",
    },
    {
      kind: "callout",
      tone: "info",
      title: "The transferable rule",
      body: "A cache's eviction condition must be an event, not a side effect. Trimming on insert is a side effect that may never fire again. Evicting on model dispose is an event that is guaranteed to fire exactly when the value becomes unreferenced.",
    },
    {
      kind: "heading",
      kicker: "Verification",
      title: "Closing the gap that let these back in",
    },
    {
      kind: "paragraph",
      body: "The dispose broadcast is wired through every disposal path in trimRetainedBuffers, scheduleDisposal, and releaseModel. One call site, so no eviction path can forget it. The full suite passed at 408 tests with a clean typecheck and lint at the time of the commit.",
    },
    {
      kind: "paragraph",
      body: "Long-session behavior is now visibly different in a DevTools heap snapshot: entries carrying a disposed URI prefix are gone rather than lingering, and hovering many files no longer grows the blame map past 256 entries.",
      hoverPhrases: [
        {
          text: "entries carrying a disposed URI prefix are gone rather than lingering",
          note: "This is the check that actually matters here. A bound you can assert in a test is a leak that cannot silently return.",
        },
      ],
    },
    {
      kind: "heading",
      kicker: "Takeaways",
      title: "Five things worth carrying to the next cache",
    },
    {
      kind: "timeline",
      items: [
        {
          label: "01",
          title: "Bound caches at their eviction event, not at their insert site",
          body: "Insert-time trimming is a heuristic. A disposal callback is an invariant.",
        },
        {
          label: "02",
          title: "Make disposal observable above the object that owns it",
          body: "Monaco disposed models correctly. Our buffer engine's LRU decided when, and without its broadcast the dependent caches never knew.",
        },
        {
          label: "03",
          title: "Use Map insertion order as a free LRU primitive",
          body: "Delete, set, then keys().next() is a complete LRU with no dependency and no extra bookkeeping.",
        },
        {
          label: "04",
          title: "Document the big intentional allocations",
          body: "A deliberate 200k-line scrollback is a product decision. Undocumented, it is a mystery that costs the next person an afternoon.",
        },
        {
          label: "05",
          title: "Long-session leaks hide from short tests",
          body: "They need a bound assertion such as never exceeding 256 entries, or a lifecycle assertion that a disposed URI's entries are gone. Both are cheap, and neither existed before.",
        },
      ],
    },
    {
      kind: "paragraph",
      body: "The renderer stopped climbing because all three leaks had one root cause, and that cause was structural rather than accidental. A Map at module scope with a string key is not a cache with a policy. Once the owner of a lifecycle broadcasts it, every cache above it can be correct by construction instead of correct by luck.",
    },
    {
      kind: "code",
      language: "text",
      filename: "commit 07a49f5",
      code: `fix: plug renderer memory leaks that grow during long sessions

- Evicted cached semantic token sets when the buffer engine disposes a model,
  so closed files no longer pin up to 80 whole-file highlight snapshots in
  memory, including across HMR reloads
- Capped the Git blame cache as a 256-entry LRU; the map previously grew with
  every repository file the cursor visited
- Kept terminal scrollback at its deliberate 200k-line default (it remains the
  largest single retained allocation per agent/test tab)`,
    },
    {
      kind: "links",
      title: "Keep exploring Axon",
      items: [
        {
          label: "Read the complete architecture series",
          href: "/blog",
          description:
            "Explore the buffer, terminal, workspace, language intelligence, security, and extension systems that make up Axon's current architecture.",
        },
        {
          label: "Read the Axon documentation",
          href: "https://axoneditor-docs.vercel.app",
          description:
            "Use the product documentation for installation, daily workflows, language tools, extension APIs, and release guidance.",
        },
        {
          label: "Inspect Axon on GitHub",
          href: "https://github.com/GordenArcher/axon",
          description:
            "Follow the implementation, tests, issues, and releases in the source repository.",
        },
      ],
    },
  ],
};
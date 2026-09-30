import { architectureBlogPosts } from "./architectureBlogPosts";
import { terminalEatingBugBlogPost } from "./terminalEatingBugBlogPost";
import { rendererMemoryLeaksBlogPost } from "./rendererMemoryLeaksBlogPost";

export type BlogAuthor = {
  name: string;
  role: string;
  avatar: string;
  github: string;
};

export type BlogSection =
  | {
      kind: "paragraph";
      body: string;
      hoverPhrases?: Array<{
        text: string;
        note: string;
      }>;
    }
  | {
      kind: "heading";
      title: string;
      kicker?: string;
    }
  | {
      kind: "code";
      language: string;
      filename?: string;
      code: string;
    }
  | {
      kind: "mermaid";
      title: string;
      diagram: string;
    }
  | {
      kind: "callout";
      title: string;
      body: string;
      tone: "info" | "warning" | "success";
    }
  | {
      kind: "timeline";
      items: Array<{
        label: string;
        title: string;
        body: string;
      }>;
    }
  | {
      kind: "links";
      title: string;
      items: Array<{
        label: string;
        href: string;
        description: string;
      }>;
    };

export type BlogPost = {
  slug: string;
  title: string;
  animatedTitles: string[];
  excerpt: string;
  authors: BlogAuthor[];
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  tags: string[];
  series?: string;
  seriesOrder?: number;
  coverImage: string;
  conclusion: string;
  sections: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  rendererMemoryLeaksBlogPost,
  terminalEatingBugBlogPost,
  ...architectureBlogPosts,
  {
    slug: "why-axon-needed-its-own-token-coloring-pipeline",
    title: "Why Axon Needed Its Own Token Coloring Pipeline",
    animatedTitles: [
      "Why Axon Needed Its Own Token Coloring Pipeline",
      "The Theme Was Right. The Editor Still Looked Wrong.",
      "Monaco Was Not Enough For Rich Code Color",
      "The CSP Bug That Made Syntax Highlighting Look Broken",
    ],
    excerpt:
      "Ayu and One had the right colors, Monaco had tokens, LSP had semantic data, and Axon still looked flat. This is the story of the token-coloring architecture that finally made the editor feel rich.",
    authors: [
      {
        name: "Gorden Archer",
        role: "Creator of Axon",
        avatar: "https://github.com/GordenArcher.png?size=96",
        github: "https://github.com/GordenArcher",
      },
    ],
    publishedAt: "2026-07-07",
    updatedAt: "2026-07-07",
    readingTime: "18 min read",
    tags: ["Axon", "Syntax Highlighting", "Monaco", "TextMate", "LSP", "Debugging"],
    coverImage: "/media/screenshots/captures/axon-capture-58.png",
    conclusion:
      "The final architecture is the part I want to keep protecting: Monaco owns editing, TextMate and LSP add richer language meaning, Axon fallbacks repair obvious local gaps, and Axon's decoration layer owns the final paint when Monaco's built-in theme path is not enough. The painful lesson is that rich code color is not one feature. It is a pipeline, and the editor has to prove every layer before I trust what I see on screen.",
    sections: [
      {
        kind: "paragraph",
        body: "This bug annoyed me more than most because it was visible every second the editor was open. Axon could have the right theme selected, the right colors imported, and the same Ayu or One palette I was comparing against in another editor, but the code still looked flat. JSX tags were weak. TypeScript types stayed plain. Go member access lost color. Python imports fell back to white. HTML inside TSX did not look like real HTML. It was not the kind of issue I could wave away as polish because code color is part of whether an editor feels serious.",
        hoverPhrases: [
          {
            text: "visible every second",
            note: "A bad syntax pipeline is not hidden infrastructure. It stares back from every file.",
          },
          {
            text: "feels serious",
            note: "This was the bar: Axon had to feel like a real editor, not a demo with colors sprinkled on top.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        title: "The misleading symptom",
        body: "The final symptom looked like a bad theme, but the actual failure was spread across token identity, Monaco's paint path, TextMate grammar loading, semantic tokens, bracket colorization, and one renderer CSP rule.",
      },
      {
        kind: "heading",
        kicker: "Wrong first suspect",
        title: "I started by blaming the theme files",
      },
      {
        kind: "paragraph",
        body: "The obvious suspect was the theme data. If a token is white when I expect blue, gold, green, or muted gray, the theme looks guilty. So I checked the imported Ayu data, checked One, checked Axon's generated Monaco rules, checked the normalizer, and kept asking why the same palette looked richer somewhere else. That work was not wasted, but it was only one layer of the problem.",
        hoverPhrases: [
          {
            text: "the theme looks guilty",
            note: "It was a reasonable guess because the bug was visual, but it was not enough.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "Some mappings really were missing. Axon needed a capture registry that could route design-level syntax names into the lower-level names emitted by Monaco, TextMate, and semantic tokens. Broad ideas like function, type, property, tag, punctuation.bracket, diff.plus, and diff.minus needed stable aliases. A good theme is not useful if the editor does not produce token identities that can reach those colors.",
      },
      {
        kind: "code",
        language: "txt",
        filename: "the first rule I had to accept",
        code: "A good theme is not enough. The editor must produce useful token identities before the theme can paint them.",
      },
      {
        kind: "heading",
        kicker: "Second wrong turn",
        title: "Monaco tokens were too shallow by themselves",
      },
      {
        kind: "paragraph",
        body: "After the theme mapping improved, the editor still did not feel rich enough. That is where Monaco's normal tokenization became the next suspect. Monarch tokenizers are fast and useful, but they often emit broad classes such as identifier, delimiter, or other. That is not enough information to make a serious theme shine. The theme can have a perfect color for type, but if the token stream only says identifier, the editor cannot magically know that the word is a component, class, property, module, or normal variable.",
        hoverPhrases: [
          {
            text: "identifier, delimiter, or other",
            note: "These are useful baseline tokens, but they are not rich enough for a modern IDE-grade color system.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "That explained why some files looked okay while others stayed weak. HTML could look fine in a plain .html file, then lose richness inside TSX. Go calls could look decent, but the receiver fields stayed plain. Python imports could expose aliases and class-like names that should clearly stand out, but Monaco still had no strong identity for them. The visual problem was really a language identity problem.",
      },
      {
        kind: "heading",
        kicker: "The external proof",
        title: "The Monaco issue changed the architecture decision",
      },
      {
        kind: "paragraph",
        body: "The important turn was checking Monaco's own issue history. I found microsoft/monaco-editor#1833, opened on February 14, 2020: semantic highlighting does not appear to work due to theming. It is still open, labeled as a probable Monaco bug, tagged under semantic-tokens, and sitting in the backlog. That changed how I read the failures in Axon. This was not only a local mapping mistake. Monaco could receive useful token information and still fail to apply the final theme color in the way a full editor experience needs.",
        hoverPhrases: [
          {
            text: "microsoft/monaco-editor#1833",
            note: "That issue was the moment I stopped treating Monaco's built-in semantic paint path as the only source of truth.",
          },
        ],
      },
      {
        kind: "links",
        title: "Reference that confirmed the direction",
        items: [
          {
            label: "Monaco editor issue #1833",
            href: "https://github.com/microsoft/monaco-editor/issues/1833",
            description: "The long-running Monaco semantic highlighting/theming issue that made it clear Axon needed to own a final decoration layer instead of trusting Monaco's paint path alone.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "The architecture split",
        body: "Monaco remains the editor engine. Axon owns the final IDE experience. If Monaco paints correctly, good. If it does not, Axon has to merge TextMate, LSP, fallbacks, and theme captures into its own final paint layer.",
      },
      {
        kind: "heading",
        kicker: "The pipeline",
        title: "The fix became layered instead of magical",
      },
      {
        kind: "paragraph",
        body: "The working rule became simple: Axon should not wait for one perfect source. It should combine all useful sources and paint the best result it has. Monaco gives the editor model, layout, cursor, editing behavior, and baseline tokens. TextMate adds real grammar scopes where Monarch is too shallow. LSP semantic tokens add symbol meaning when the language server is ready. Axon fallbacks repair high-value local syntax gaps. The decoration layer applies the final rich colors when Monaco's built-in paint path is not strong enough.",
      },
      {
        kind: "timeline",
        items: [
          {
            label: "01",
            title: "Theme import",
            body: "Imported themes become Axon syntax tokens instead of one-off Monaco-only colors.",
          },
          {
            label: "02",
            title: "Capture registry",
            body: "Design-level captures such as type, function, property, tag, and punctuation map into Monaco, TextMate, and semantic-token-facing names.",
          },
          {
            label: "03",
            title: "TextMate and LSP",
            body: "Grammar scopes and semantic tokens add the detail Monaco's baseline token stream often cannot provide.",
          },
          {
            label: "04",
            title: "Axon decorations",
            body: "When Monaco has the information but does not paint it correctly, Axon applies final theme-aware decorations over exact ranges.",
          },
        ],
      },
      {
        kind: "heading",
        kicker: "The painful blocker",
        title: "The architecture still looked broken because WebAssembly was blocked",
      },
      {
        kind: "paragraph",
        body: "This is the part that made the whole thing feel ridiculous. The grammar modules were loading. The capture registry had grown. Semantic decoration code existed. The token inspector could show expected colors. The active theme syntax count looked right. And yet the editor still looked flat. It was tempting to keep changing theme aliases forever, but the architecture was already close. The runtime layer was failing before the grammar engine could do its job.",
        hoverPhrases: [
          {
            text: "keep changing theme aliases forever",
            note: "This was the trap. The theme could not fix a blocked grammar engine.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "The token inspector finally exposed it: the TextMate highlighter was not ready because Electron's renderer Content-Security-Policy blocked WebAssembly compilation. The inlined Oniguruma engine needed that path. Without it, the TextMate layer never really came alive, so the whole pipeline looked broken even though the code structure was right. The symptom looked like a theme failure. The cause was an HTML CSP header.",
      },
      {
        kind: "code",
        language: "txt",
        filename: "token inspector error",
        code: "WebAssembly.instantiate(): Compiling or instantiating WebAssembly module violates the Content Security policy directive because 'unsafe-eval' is not an allowed source of script.",
      },
      {
        kind: "callout",
        tone: "success",
        title: "The moment it started working",
        body: "Once the renderer CSP allowed the WebAssembly path needed by the inlined Oniguruma engine, TextMate became ready and TSX/JSX jumped from flat Monaco tokens to rich Axon colors.",
      },
      {
        kind: "heading",
        kicker: "The tool that saved the work",
        title: "The token inspector made the bug debuggable",
      },
      {
        kind: "paragraph",
        body: "The token inspector changed the debugging from screenshots and frustration into proof. It reports the file path, language id, Monaco model token, rendered class, active theme id, syntax count, semantic token type, semantic selector, expected color, decoration class, TextMate readiness, TextMate errors, and capture matches. That matters because a wrong color can come from many places, and guessing from the screen is not good enough.",
      },
      {
        kind: "timeline",
        items: [
          {
            label: "Theme",
            title: "Does the active theme have the color?",
            body: "The inspector shows active theme id and syntax count so I can tell whether the theme data is even loaded.",
          },
          {
            label: "Token",
            title: "What did Monaco produce?",
            body: "The model token and rendered class explain whether Monaco gave Axon a useful identity or a generic fallback.",
          },
          {
            label: "Grammar",
            title: "Is TextMate actually ready?",
            body: "The WebAssembly CSP failure became obvious only because the inspector exposed TextMate readiness and errors.",
          },
          {
            label: "Paint",
            title: "What color should Axon apply?",
            body: "Semantic selector, expected color, and decoration class show whether Axon's final paint layer has enough information.",
          },
        ],
      },
      {
        kind: "heading",
        kicker: "The final shape",
        title: "Language fallbacks are part of the architecture, but they must stay targeted",
      },
      {
        kind: "paragraph",
        body: "TextMate and LSP are strong, but they do not remove the need for practical local fallbacks. Python imports are a good example: aliases and class-like names should not stay plain white when the syntax around them makes their role obvious. Go member chains are another example. In h.applicationService.GetByID(c.Request.Context(), c.Param(\"id\"), \"\"), applicationService and Request should read as properties, while GetByID, Context, and Param should read as calls. Axon can improve that without pretending to know arbitrary symbol meaning.",
      },
      {
        kind: "paragraph",
        body: "The important discipline is that fallbacks cannot become random theme overrides. A fallback belongs in the pipeline only when the grammar or LSP repeatedly misses a high-value local syntax pattern and the richer classification is obvious from nearby syntax. That keeps the architecture strong instead of turning syntax highlighting into a pile of special cases.",
        hoverPhrases: [
          {
            text: "cannot become random theme overrides",
            note: "This is the line that keeps the coloring system maintainable.",
          },
        ],
      },
      {
        kind: "heading",
        kicker: "The rule going forward",
        title: "Monaco owns editing. Axon owns the final color experience.",
      },
      {
        kind: "paragraph",
        body: "That is the architectural decision I want to keep. Monaco owns the editor surface: models, cursors, layout, input, selections, and the base token stream. Axon owns the rich IDE experience layered on top. Theme imports, capture mapping, TextMate scopes, LSP semantic tokens, language fallbacks, and final decorations all exist so Axon can make code feel alive even when one layer is incomplete, late, or wrong.",
      },
      {
        kind: "paragraph",
        body: "The pain was worth documenting because this is exactly the kind of bug that comes back if I only remember the final fix and forget the trail. The next time syntax color looks wrong, I should not start by changing colors. I should open the token inspector, prove which layer failed, and fix that layer inside the pipeline.",
        hoverPhrases: [
          {
            text: "prove which layer failed",
            note: "That is the whole point of the architecture: no more guessing from screenshots alone.",
          },
        ],
      },
    ],
  },
  {
    slug: "the-go-lsp-fix-that-finally-worked",
    title: "The Go LSP Fix That Finally Worked",
    animatedTitles: [
      "The Go LSP Fix That Finally Worked",
      "When gopls Started, Initialized, and Still Did Nothing",
      "The Bug Was Not Go. It Was the Launch Environment.",
      "Dock Launches Are Not Terminal Launches",
    ],
    excerpt:
      "Rust, Python, and C++ were coming alive in Axon, but Go kept acting like it had joined the meeting and muted itself. This is the full story of the fix that finally made gopls work in the packaged app.",
    authors: [
      {
        name: "Gorden Archer",
        role: "Creator of Axon",
        avatar: "https://github.com/GordenArcher.png?size=96",
        github: "https://github.com/GordenArcher",
      },
    ],
    publishedAt: "2026-06-16",
    updatedAt: "2026-06-16",
    readingTime: "16 min read",
    tags: ["Axon", "Go", "gopls", "LSP", "Electron", "Debugging"],
    coverImage: "/media/screenshots/captures/axon-capture-57.png",
    conclusion:
      "The final lesson was simple but painful: a bundled language server is only truly bundled when the process you spawn has the environment it needs to behave like the user's real development machine. gopls was present. gopls was executable. gopls initialized. But until Axon gave it the same shell environment I had in Terminal, it could not complete the job. Now Go works from the packaged app, and that one stubborn bug made the whole LSP layer stronger.",
    sections: [
      {
        kind: "paragraph",
        body: "I had one of those bugs that looks fixed three different times before it finally admits what it really is. Go LSP in Axon was that bug. In development it looked fine. When I launched the packaged app from Terminal, it looked fine. Rust was coming up. Python was working. C++ had its own noise, but it was at least showing life. Then I opened Axon like a normal person from the Applications folder and Go just sat there like it had no plans for the day.",
        hoverPhrases: [
          {
            text: "looks fixed three different times",
            note: "This is the exact kind of bug that makes a developer start negotiating with the machine.",
          },
          {
            text: "Go just sat there",
            note: "The server was not fully dead. That was the annoying part.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        title: "The confusing part",
        body: "The packaged app could spawn gopls and initialize it, but the editor still had no useful Go intelligence. That meant the first obvious explanations were wrong.",
      },
      {
        kind: "code",
        language: "txt",
        filename: "packaged Axon logs",
        code: `[LSP INIT FAIL] go go language server stopped.
[LSP SPAWN OK] go
[LSP INIT OK] go`,
      },
      {
        kind: "paragraph",
        body: "Those logs were both useful and rude. Useful because they proved gopls was in the app and could run. Rude because they removed the easy answer. I could no longer say, 'Ah, the binary is missing.' The binary was there. The wrapper was there. The process started. The initialize request even came back successfully on the second attempt.",
        hoverPhrases: [
          {
            text: "useful and rude",
            note: "Good logs are honest, but sometimes honesty is disrespectful.",
          },
          {
            text: "The binary was there",
            note: "This ruled out the packaging path and extraResources as the main issue.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "That was the moment the bug stopped being a simple packaging failure. If the binary could not spawn, I would know where to look. If initialize failed every time, I would know where to look. But this was worse: the first start failed, the second start looked healthy, and the editor still behaved like Go had no language intelligence behind it. That meant the failure was hiding between layers, not sitting neatly in one file waiting to be deleted.",
        hoverPhrases: [
          {
            text: "hiding between layers",
            note: "The main process, renderer, language-server process, and Monaco bridge all had to agree before completions could feel alive.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "The trap",
        body: "A language server can be installed, found, spawned, and initialized while the editor still feels dead if the renderer is holding stale state or the child process launched with a weak environment.",
      },
      {
        kind: "heading",
        kicker: "First wrong turn",
        title: "I thought this was still a bundling problem",
      },
      {
        kind: "paragraph",
        body: "The first suspicion made sense: managed language servers live inside the packaged app, and if the release did not include the correct platform bundle, Go would fail. Axon resolves native servers from the app resources path in production, so I checked whether gopls was actually present inside the app bundle.",
      },
      {
        kind: "code",
        language: "txt",
        filename: "expected packaged path",
        code: `/Applications/Axon.app/Contents/Resources/language-servers/darwin-x64/go/bin/gopls`,
      },
      {
        kind: "paragraph",
        body: "But that path existed. The local packaged build also had gopls inside release/mac/Axon.app. So the bug moved from 'the app cannot find gopls' to 'gopls starts, but Go intelligence still does not arrive in the editor.' That is a completely different class of problem.",
        hoverPhrases: [
          {
            text: "completely different class of problem",
            note: "The bug had left packaging and entered runtime behavior.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "That distinction matters. Packaged does not automatically mean usable. A binary sitting inside Contents/Resources only proves electron-builder copied it. It does not prove the child process wakes up with a useful HOME, PATH, TMPDIR, workspace cwd, or enough project context to do real analysis. At this point I had to stop asking whether gopls existed and start asking what kind of world Axon was launching it into.",
        hoverPhrases: [
          {
            text: "Packaged does not automatically mean usable",
            note: "This became the main lesson of the whole fix.",
          },
          {
            text: "what kind of world",
            note: "A process environment is the world a language server wakes up inside.",
          },
        ],
      },
      {
        kind: "heading",
        kicker: "What I had to prove",
        title: "The question changed from where is gopls to how is gopls launched",
      },
      {
        kind: "paragraph",
        body: "Once I knew the binary was there, the checklist changed. I had to verify the resolved command path, the launch args, the cwd, the inherited environment, and the renderer retry behavior. Any one of those could produce the same user-facing symptom: no completion popup, no hover, no Go intelligence, just vibes and disappointment.",
        hoverPhrases: [
          {
            text: "just vibes and disappointment",
            note: "Not a language-server architecture I recommend.",
          },
        ],
      },
      {
        kind: "timeline",
        items: [
          {
            label: "Path",
            title: "The executable path was valid",
            body: "Axon resolved the managed bundle path inside the packaged app, so the release asset was not simply missing gopls.",
          },
          {
            label: "Args",
            title: "Launch flags had to be language-specific",
            body: "C++ made this obvious when clangd rejected a server flag that another language server might accept. Every server has its own expectations.",
          },
          {
            label: "Env",
            title: "The process environment was suspicious",
            body: "Terminal launches inherited my shell setup. Dock launches did not. That one difference explained why the same app behaved differently.",
          },
          {
            label: "Retry",
            title: "The renderer could lock itself out",
            body: "If the first start failed and the UI remembered that it had already tried, the next file open could be blocked from requesting a clean restart.",
          },
        ],
      },
      {
        kind: "timeline",
        items: [
          {
            label: "01",
            title: "Dev mode worked",
            body: "Running Axon through the development command inherited my normal shell setup, so gopls had access to the same PATH and Go tooling I use every day.",
          },
          {
            label: "02",
            title: "Terminal launch worked",
            body: "Opening the packaged binary from Terminal also worked because the app inherited the terminal environment.",
          },
          {
            label: "03",
            title: "Dock launch failed",
            body: "Opening the same app from Finder, Dock, or Applications gave Electron a much smaller macOS environment. That was the real split.",
          },
        ],
      },
      {
        kind: "heading",
        kicker: "The loop",
        title: "The fix was not one commit. It was a whole argument with reality.",
      },
      {
        kind: "paragraph",
        body: "The funny part is that every fix made sense at the time. I fixed packaging so Node-backed language servers could run outside asar. I added a richer environment for managed native LSP servers. I added debug logs because guessing was getting embarrassing. I fixed the retry gate because gopls could fail once during cold start and the renderer would hold onto a stale start key like it was a family heirloom. Then I fixed active-file routing so YAML, Docker, shell files, env files, and ignore files went to the right server instead of sitting in plaintext.",
        hoverPhrases: [
          {
            text: "guessing was getting embarrassing",
            note: "At some point logs are not optional. They are self-respect.",
          },
          {
            text: "family heirloom",
            note: "A stale Set key can hold a bug hostage longer than expected.",
          },
        ],
      },
      {
        kind: "code",
        language: "txt",
        filename: "the fix trail",
        code: `32f9732 fix: package node language servers outside asar
412081a fix: pass enriched env to managed native LSP servers on spawn
1e25694 fix: add managed LSP startup debug logs
e757fdd fix: retry Go LSP after cold-start exit and fix C++ stdio flag
a3b5758 fix: start bundled LSPs for active config files
f9fa4a7 fix: stabilize bundled LSPs across workspaces`,
      },
      {
        kind: "paragraph",
        body: "Each one removed a real bug. That is what made the final problem so irritating. It was not that the earlier fixes were useless. They were necessary. They moved the system closer to the truth. But Go still refused to fully work in the one place that mattered: the released desktop app opened normally.",
        hoverPhrases: [
          {
            text: "closer to the truth",
            note: "Debugging is often less about one magic fix and more about removing wrong explanations.",
          },
          {
            text: "the one place that mattered",
            note: "Dev mode passing is nice. Packaged app passing is the actual product.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "From the outside it can sound like I fixed the same issue over and over. From inside the codebase, it felt more like peeling layers off one stubborn system. First the app needed to package the right files. Then Node-backed servers had to run outside asar. Then native servers needed a usable environment. Then failed starts needed to unlock the renderer retry gate. Then config files like Docker, YAML, env files, and ignore files needed to stop falling back to plaintext.",
        hoverPhrases: [
          {
            text: "peeling layers",
            note: "Not glamorous, but accurate. Each layer exposed the next actual failure.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "The painful part was the feedback cycle. Patch it. Build it. Push it. Retag it. Wait for GitHub Actions. Download the app. Replace the local copy. Open it from Applications. Try a real Go project. Watch completions still not show. Then take a deep breath and pretend I was not personally offended by a child process.",
        hoverPhrases: [
          {
            text: "personally offended",
            note: "A professional engineering feeling, obviously.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        title: "The annoying release loop",
        body: "I would patch it, build it, push it, retag it, wait for GitHub Actions, download it, open it, and then Go would still not behave. At that point the bug was no longer just technical; it was personal.",
      },
      {
        kind: "heading",
        kicker: "The actual clue",
        title: "Terminal launch and Dock launch are not the same thing",
      },
      {
        kind: "paragraph",
        body: "This was the part that finally made the bug make sense. When I started Axon from Terminal, Go worked. When I opened Axon like a normal desktop app, Go did not. Same code. Same gopls bundle. Same workspace. Different parent environment.",
        hoverPhrases: [
          {
            text: "Different parent environment",
            note: "This is the entire bug in four words.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "macOS does not launch GUI apps with the same environment as an interactive shell. The Dock does not care what my .zshrc lovingly prepared. It does not wake up and say, 'Let me load Gorden's Homebrew path before I launch this editor.' It gives the app a small, clean environment. That is fine for many apps, but language servers are not normal little apps. They inspect projects, read caches, sometimes shell out, and often expect basic developer paths to exist.",
        hoverPhrases: [
          {
            text: "lovingly prepared",
            note: "My shell config did its best. The Dock simply ignored the family meeting.",
          },
          {
            text: "language servers are not normal little apps",
            note: "They behave more like project analysis engines than simple child processes.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "That explained why my tests kept disagreeing with each other. Terminal launch was useful, but it was also accidentally generous. It handed Axon the same shell environment I use every day. Finder and Dock were stricter. They launched the app like a desktop app, not like a child of my carefully prepared terminal session. The product has to survive that stricter path.",
        hoverPhrases: [
          {
            text: "accidentally generous",
            note: "Terminal was giving Axon help that normal users do not know they are supposed to provide.",
          },
        ],
      },
      {
        kind: "code",
        language: "txt",
        filename: "the behavior split",
        code: `Launched from Terminal:
  Axon inherits shell PATH
  gopls gets the environment it expects
  Go completions show up

Launched from Finder or Dock:
  Axon receives a stripped GUI environment
  native servers get fewer assumptions for free
  Go can start, but the editor experience can still look dead`,
      },
      {
        kind: "callout",
        tone: "info",
        title: "The important distinction",
        body: "gopls is bundled, but it still needs a realistic process environment. It can be present and executable while still failing to analyze a real Go workspace properly.",
      },
      {
        kind: "heading",
        kicker: "The fix",
        title: "Axon now rebuilds the shell environment before spawning native LSPs",
      },
      {
        kind: "paragraph",
        body: "The final clue came from testing the same build two ways. I ran the packaged binary from Terminal and Go worked. I opened the app bundle from Finder and Go did not. That made the bug brutally specific. The code path was the same. The binary was the same. The bundled gopls path was the same. The only meaningful difference was the environment inherited by the Axon process.",
        hoverPhrases: [
          {
            text: "two ways",
            note: "This was the test that finally split the bug cleanly.",
          },
          {
            text: "brutally specific",
            note: "The best kind of clue: narrow enough to act on, rude enough to remember.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "The final fix was not to download Go, inject GOPATH, or pretend every user has the same machine. The fix was to make Axon recover the login-shell environment on macOS, merge that PATH with safe fallback paths, and pass HOME, PATH, and TMPDIR into managed native language server spawns.",
      },
      {
        kind: "paragraph",
        body: "I did not want the fix to depend on my laptop. That would have been another fake win. Axon should not hardcode my personal Homebrew path as the whole truth, and it should not expose local machine paths just to make a demo pass. The app needs to reconstruct a useful environment from the user's actual shell, then add conservative fallbacks only where the OS launch path is too empty.",
        hoverPhrases: [
          {
            text: "another fake win",
            note: "A fix that only works on the developer's machine is just a bug wearing a new shirt.",
          },
        ],
      },
      {
        kind: "code",
        language: "ts",
        filename: "the important idea",
        code: `const shell = process.env.SHELL || "/bin/zsh";
const loginEnv = await readLoginShellEnvironment(shell);

spawn(goplsPath, args, {
  cwd: folderPath,
  env: {
    ...loginEnv,
    ...process.env,
    HOME,
    PATH: mergePathValues(loginEnv.PATH, process.env.PATH, fallbackPath),
    TMPDIR,
  },
});`,
      },
      {
        kind: "paragraph",
        body: "That changed the packaged app behavior immediately. gopls still came from Axon's bundled language server folder, but it now launched with the kind of environment it expects on a developer machine. The server could initialize, analyze the workspace, and actually provide useful completions and hover information.",
        hoverPhrases: [
          {
            text: "actually provide useful completions",
            note: "The part I wanted from the beginning. Imagine that.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "The important part is that this did not weaken the bundled-LSP story. Users still do not need to install gopls globally for Axon to locate the language server binary. The managed server still ships with the app. The environment fix simply gives that bundled process the operating context it needs: a home directory for cache, a temp directory for temporary work, and a PATH that reflects how developers actually configure macOS machines.",
      },
      {
        kind: "timeline",
        items: [
          {
            label: "A",
            title: "gopls stayed bundled",
            body: "The fix did not make users install gopls globally. Axon still launches the managed binary from Contents/Resources/language-servers.",
          },
          {
            label: "B",
            title: "The child process got a real environment",
            body: "HOME, PATH, and TMPDIR became explicit, and the macOS login shell PATH was merged into the spawn environment.",
          },
          {
            label: "C",
            title: "The editor stopped lying to itself",
            body: "LSP config requests now get a useful empty object instead of null, and failed starts can unlock the renderer retry gate.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "The moment it worked from the local packaged app, I knew the release fix was real. Not 'it works in dev' real. Not 'it works if I launch it from Terminal' real. Actual desktop app real. That is the difference between a feature and a feature-shaped rumor.",
        hoverPhrases: [
          {
            text: "feature-shaped rumor",
            note: "If it only works in the perfect dev path, it is still campaigning for feature status.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "success",
        title: "The test that mattered",
        body: "The final passing test was not npm run dev. It was opening the built Axon.app normally, loading a Go workspace, typing real code, and watching gopls answer like it belonged there.",
      },
      {
        kind: "heading",
        kicker: "The second fix",
        title: "Python also needed workspace-aware environment selection",
      },
      {
        kind: "paragraph",
        body: "While fixing Go, I also tightened Python. Python has a different problem: the interpreter is usually workspace-specific. A virtual environment from one project should not quietly follow me into another project. That would make imports look broken in a way that feels random.",
      },
      {
        kind: "paragraph",
        body: "Axon now detects common workspace virtual environments like .venv, venv, env, .env, and virtualenv. If a workspace has its own axon.json, that workspace setting wins. If it does not, Axon detects fresh from the active folder instead of reusing a stale user-level interpreter from a different project.",
        hoverPhrases: [
          {
            text: "detects fresh from the active folder",
            note: "This is the behavior I expect when switching projects.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "That workspace boundary is what makes Python feel sane. A Django REST Framework backend, a small script folder, and a quick experiment project should not all inherit the same interpreter just because I selected one yesterday. When the workspace changes, Axon needs to detect again before it assumes anything.",
        hoverPhrases: [
          {
            text: "workspace boundary",
            note: "This is the rule that keeps Python imports from feeling haunted.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "success",
        title: "What finally worked",
        body: "Go now works from the packaged app opened normally from Finder/Dock, and Python interpreter selection is tied to the active workspace instead of leaking across projects.",
      },
      {
        kind: "heading",
        kicker: "Why this mattered",
        title: "An editor is not serious until language intelligence works outside dev mode",
      },
      {
        kind: "paragraph",
        body: "This mattered because Axon is not supposed to be a toy that only behaves when I run it from a terminal with perfect conditions. I want to use Axon to build Axon. That means the packaged app has to behave like the development app. If LSP only works in dev, the editor is pretending.",
        hoverPhrases: [
          {
            text: "I want to use Axon to build Axon",
            note: "That is the real test. If I cannot live in it, it is not ready.",
          },
          {
            text: "the editor is pretending",
            note: "Strong wording, but fair.",
          },
        ],
      },
      {
        kind: "paragraph",
        body: "A real editor has to survive boring, normal usage. Open it from the Dock. Switch projects. Close it. Reopen it. Use a virtual environment. Open a Go file. Open a YAML file. Jump between tabs. Expect completions without performing a ritual first. That is the standard I wanted Axon to move toward with this fix.",
        hoverPhrases: [
          {
            text: "without performing a ritual first",
            note: "No developer should need a secret launch sequence for autocomplete.",
          },
        ],
      },
      {
        kind: "heading",
        kicker: "What changed in my head",
        title: "This bug made the LSP architecture better, not just Go",
      },
      {
        kind: "paragraph",
        body: "The best outcome is that this did not only fix Go. It forced the LSP layer to become more honest. Status messages had to mean something. Spawn failures had to be visible. Retry behavior had to recover instead of quietly locking the user out. File language detection had to respect real config files. Python interpreter state had to be scoped to the workspace. All of those are editor-quality details.",
      },
      {
        kind: "paragraph",
        body: "So yes, I was annoyed while fixing it. Very annoyed. But technically, the pain was useful. It exposed the difference between a feature that works in the happy path and infrastructure that holds up when the app is packaged, moved, relaunched, and used like a normal tool.",
        hoverPhrases: [
          {
            text: "Very annoyed",
            note: "Calmly. Professionally. With only a small amount of staring at the screen.",
          },
          {
            text: "infrastructure that holds up",
            note: "This is the kind of foundation Axon needs before bigger AI work can sit on top of it.",
          },
        ],
      },
      {
        kind: "links",
        title: "Related pieces",
        items: [
          {
            label: "Axon releases",
            href: "/releases",
            description: "The release notes where these fixes are shipped.",
          },
          {
            label: "Language server docs",
            href: "https://axoneditor-docs.vercel.app/docs/language-servers",
            description: "How Axon treats language servers as real editor infrastructure.",
          },
          {
            label: "Axon on GitHub",
            href: "https://github.com/axon-editor/axon",
            description: "The source code and release builds.",
          },
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}

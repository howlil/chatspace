# Current Iteration

Status: **READY_FOR_MILESTONE**

## Feature Compass

**Shape:** Chatspace is a local-first companion beside native ChatGPT whose daily loop is contextual save, remember why, continue/find, and resume; Library, durable notes, advanced knowledge navigation, and portability support that loop without competing with it.

**Position:** M18 — Core Navigation & Daily-Use Flow Simplification is complete and deterministically verified.

**Delta:** M18 translates the M17 product focus into information architecture and interaction flow: Home exposes current-conversation context and direct save; Continue no longer duplicates pinned shortcuts; empty Inbox is demoted; Quick Open groups daily retrieval before advanced objects; Home / Library / Settings are the primary user jobs; Graph is under More; vault/data maintenance is consolidated under Settings; and resume reuses/focuses matching ChatGPT tabs when possible.

**Next Move:** Merge PR #44. After integration to `master`, select the next milestone from the highest-value missing core user capability rather than continuing M18 polish by default.

## Completed milestone decomposition

```text
Product purpose: durable local context around native ChatGPT
Core journey: current context -> save -> remember -> continue/find -> resume -> organize/distill -> own
Milestone: M18 — Core Navigation & Daily-Use Flow Simplification

Slice 1 — Contextual current-chat entry point
  COMPLETE
  Home current-conversation state + direct Save + safe browser-tab-title prefill

Slice 2 — Focused Home working set
  COMPLETE
  unpinned Continue + distinct Pinned shortcuts + non-empty-only Inbox prominence

Slice 3 — Retrieval-oriented Quick Open
  COMPLETE
  grouped empty/search states + advanced Saved View demotion without removing searchability

Slice 4 — Simplified primary navigation
  COMPLETE
  Home / Library / Settings + Graph behind More
  Workbench retained only as an internal implementation concept

Slice 5 — Advanced knowledge progressive disclosure
  COMPLETE
  Graph advanced; Saved Views secondary; note properties/backlinks/related context remain note-scoped

Slice 6 — Settings consolidation
  COMPLETE
  Markdown vault + backup/import/export/recovery under Settings

Slice 7 — Seamless resume
  COMPLETE
  focus matching validated ChatGPT tab -> reuse active supported tab -> create validated target

Slice 8 — Integrated deterministic verification
  COMPLETE
  focused M18 flow/provider/retrieval coverage + full relevant repository CI
```

## M18 product outcome

When the user opens Chatspace beside ChatGPT, the primary experience centers the current conversation and the next likely action instead of exposing the product as a list of PKM modules. Later retrieval starts from recent/pinned local work, and resume returns directly to the validated native ChatGPT target. Organization, Graph, saved views, metadata, portability, and vault integration remain available through deliberate secondary/contextual surfaces.

## Acceptance status

- [x] Home shows current supported ChatGPT conversation context and saved/unsaved state;
- [x] current conversation can be saved directly from Home;
- [x] safe browser-tab title metadata can prefill the editable local name without provider DOM/message access;
- [x] name remains the only required capture field; Why saved/folder/pin remain optional;
- [x] Continue excludes pinned chats while retaining recent unpinned chats + non-Inbox notes;
- [x] Inbox is not rendered as a prominent Home section when empty;
- [x] Quick Open empty state groups Continue / Pinned / Library / Actions;
- [x] explicit search groups Chats / Notes / Folders / Actions / Saved views;
- [x] advanced Saved Views stay searchable but do not occupy empty-state attention;
- [x] primary user-facing jobs are Home / Library / Settings; Graph is under More;
- [x] user-facing accessibility terminology uses Library rather than Explorer/Workbench;
- [x] note properties/backlinks/related context remain note-scoped;
- [x] Markdown vault and data maintenance entry points live under Settings;
- [x] resume first focuses an already-open matching validated ChatGPT conversation target;
- [x] fallback resume reuses the active supported ChatGPT tab or opens a validated target;
- [x] no provider DOM/history/message scraping, AI semantic search, embeddings, Graph/property/view expansion, template expansion, background sync, new provider, or schema change was introduced;
- [x] deterministic M18 integration/provider/retrieval coverage is present;
- [x] CI #303 passed frozen install, lint, strict TypeScript, 121 deterministic tests across 35 files, extension production build/ZIP, and final `verify`.

## Verification evidence

- CI #303 (`33800399837`) passed on implementation-complete head `f5ec753ef793c97562869c2ea917f4db718e9066`.
- Test result: **35 test files passed / 121 tests passed**.
- Production Chromium MV3 package built successfully as `.output/chatspace-0.0.0-chrome.zip`.
- Initial M18 CI failed at strict TypeScript because `exactOptionalPropertyTypes` rejected an explicitly propagated absent optional Settings integration callback. The callback contract was corrected without weakening strict TypeScript or CI.
- A later deterministic test run exposed three legacy UX expectations that contradicted the approved M18 IA: `Command palette` vs `Quick open`, `Explorer` vs `Library`, and empty-state Saved View visibility. Production behavior was retained and the tests were updated to assert the approved user contract, including explicit Saved View searchability.
- M18-specific deterministic coverage verifies contextual current-conversation capture/name prefill, Continue/Pinned separation, primary navigation + Settings vault entry, Quick Open grouping, and provider matching-tab reuse.

## Completion rule

M18 is complete. Separate black-box/live-browser acceptance is not required. Do not extend M18 with nice-to-have polish by default; choose the next milestone from the highest-value missing core capability after PR #44 is integrated to `master`.

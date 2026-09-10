# Current Iteration

Status: **COMPLETE**

## M24 — Production Canvas Core

**Outcome:** make the conversation canvas stable, accessible, incremental, and release-trustworthy without changing ChatGPT's execution authority.

Delivered:

- prompt and response provider ids are aliases for one logical turn, including prompt-only -> completed response;
- keyed topology rendering preserves unaffected card DOM instead of recreating the graph;
- semantic zoom keeps the card geometry used by layout, edges, centering, and minimap constant;
- topology changes preserve the selected/current node's screen anchor when possible;
- known rendered-message mutations use a one-node refresh path, while topology/unknown changes fall back to a scoped main-conversation reconciliation;
- conversation discovery prefers rendered turn containers and ignores message-like DOM outside the active main region;
- inspector markup uses an explicit allowlist sanitizer and restricted URL schemes;
- roving card focus supports parent/child/sibling keyboard navigation, with visible focus and inspector focus return;
- persistence schema v2 stores structural metadata under independent family/target keys, avoiding unrelated multi-tab read-modify-write clobber;
- README, Privacy, Security, Project, Architecture, Design, Decisions, Code Patterns, and Quality authorities match the active runtime;
- unused React, React DOM, Lucide React, Tailwind, React testing/module/type dependencies were removed and the pnpm lockfile regenerated;
- regression coverage includes logical turn aliases, pending->completed lifecycle, streaming stable DOM, topology DOM preservation, provider-region scoping, sanitizer safety, branch layout, viewport pan/zoom, spatial anchoring, keyboard navigation, native fork delegation, and early-document mount.

## Verification

Implementation verification passed:

- lint: green;
- strict typecheck: green;
- deterministic tests: green;
- extension build/package: green;
- landing build: green;
- final relevant-gates verify: green.

M24 is complete. Further optimization of unknown provider mutations should be driven by profiling on long real conversations rather than speculative complexity.

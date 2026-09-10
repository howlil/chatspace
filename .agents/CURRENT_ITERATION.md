# Current Iteration

Status: **VERIFYING**

## M25 — Spatial Canvas Interaction & Latency

**Outcome:** make Chatspace behave like a viewport-owned spatial graph rather than a scrolling document or continuously auto-laid-out flowchart, while keeping pointer interaction cheap.

Implemented:

- active canvas projection locks document scrolling; long content scrolls only inside the inspector;
- cards can be dragged freely in world coordinates, including correctly under zoom;
- existing card coordinates survive topology growth; automatic layout only seeds newly discovered nodes;
- explicit `Arrange` / `A` restores the deterministic chronological tree layout;
- smooth connectors follow arbitrary card geometry instead of assuming rigid orthogonal placement;
- node-drag hot path updates one card directly and patches only incident edge paths per animation frame;
- full edge bounds and minimap are reconciled once when dragging ends;
- pan/zoom remains a single scene transform rather than graph re-render work;
- card containment/content-visibility hints reduce offscreen layout/paint work;
- moving-scene overlays no longer use backdrop blur, and node entrance motion no longer animates CSS filters;
- canvas surfaces, spacing, radii, controls, and interaction states now share explicit design tokens;
- focused regression coverage protects scroll-lock cleanup and manual-position stability across topology growth.

## Verification

Required before merge:

- lint;
- strict typecheck;
- deterministic tests;
- extension build/package.

PR CI is the release gate because the current environment cannot fetch the repository into a local runner.

## Previous baseline

M24 — Production Canvas Core is complete and remains the behavioral baseline for provider safety, logical-turn identity, incremental rendering, sanitizer behavior, persistence, keyboard navigation, and native Continue/Fork delegation.

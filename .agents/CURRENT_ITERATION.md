# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Ship a product-specific Astro landing page under `landing/` that explains Chatspace clearly to public repository visitors, demonstrates the real product model, provides a truthful source-install path, and preserves the product's local-first/provider boundaries.

Why: Chatspace had a coherent daily-driver product shape but no dedicated public product surface. Repository visitors previously had to infer the experience from README text and source structure. M9 gives the project a truthful public entry surface without inventing capabilities, fake social proof, or generic AI/SaaS styling.

## Feature Compass

**Shape:** Chatspace remains a local-first Chromium Side Panel workspace beside native ChatGPT. `landing/` is a static public presentation surface only; it does not participate in extension runtime, persistence, provider integration, permissions, or filesystem behavior.

**Position:** M9 is complete. The Astro landing, product-specific visual narrative, standalone dependency boundary, and deterministic landing build gate are implemented and verified.

**Delta:** Added a public static Astro surface that communicates current Notes, Graph, manual Markdown Sync, local-first ownership, provider boundaries, development status, and source-install flow while leaving extension behavior unchanged.

**Next Move:** Bound the next milestone only from an explicit product/engineering outcome; do not create a black-box/live-browser milestone.

## Scope

### In

- Astro static site under `landing/`;
- compact, clean, minimalist, restrained steel-blue visual language aligned with root `DESIGN.md`;
- product-specific hero showing Chatspace Side Panel beside native ChatGPT rather than generic decorative artwork;
- truthful Notes, Graph, Markdown Sync, local-first, provider-boundary, privacy/security, status, and install-from-source communication;
- responsive narrow/mobile behavior, keyboard focus, reduced-motion support, semantic structure, and light/dark themes;
- direct links to repository, privacy policy, and security policy;
- standalone landing dependency lock and deterministic landing build in CI;
- explicit pnpm dependency-build allowlist limited to Astro's required `esbuild` install script;
- no claim of a specific OSS license while the repository has no `LICENSE` file.

### Out

- no extension feature or behavior change;
- no `WorkspaceSnapshot`, provider, storage, permission, filesystem, Graph mechanics, or Markdown Sync contract change;
- no analytics, telemetry, cookies, forms, newsletter, accounts, CMS, or external font dependency;
- no fabricated user counts, testimonials, stars, benchmarks, or release claims;
- no Chrome Web Store CTA before a public/store-ready release exists;
- no new license selection; licensing remains a separate explicit product/legal decision;
- no broad root visual-system rewrite and no black-box milestone.

## Slices

- [x] **Slice 1 — Product narrative and Astro scaffold:** bound public messaging to current repository truth and established the standalone Astro site.
- [x] **Slice 2 — Landing experience:** implemented hero/product visualization, Notes/Graph/Sync showcases, trust boundaries, install path, responsive behavior, and light/dark theming.
- [x] **Slice 3 — Reproducible build:** committed a standalone landing lockfile, explicitly allowed only the required `esbuild` dependency build, and added frozen install + Astro build to CI.
- [x] **Slice 4 — Cleanup and milestone gate:** removed the temporary lockfile-generation workflow, inspected the final diff, and passed the combined extension + landing repository gate.

## Current Decisions

- Landing page is a presentation surface, not a second application runtime.
- Astro is used without React/Tailwind/component-library integrations because the static page does not need client framework state and minimum dependency surface is preferred.
- The landing reuses Chatspace's neutral + desaturated steel-blue direction but owns its CSS locally; extension `cs-*` runtime tokens are not coupled across package boundaries.
- Product visuals are HTML/CSS/SVG representations of real Chatspace concepts rather than stock screenshots or unrelated decorative imagery.
- Public copy distinguishes repository/source availability from an OSS license until a `LICENSE` file exists.
- Root `DESIGN.md` remains the durable visual/product-experience authority. Root `SECURITY.md` and `PRIVACY.md` remain public-facing repository policies, not `.agents` authority files.
- pnpm dependency lifecycle execution for the landing is allowlisted narrowly (`esbuild: true`); broad build-script approval is intentionally not used.

## Verification / Evidence

- Astro pinned to `7.2.0`; Node boundary matches repo requirement (`>=22.12.0`).
- Landing has its own pnpm workspace manifest and lockfile; dependency lifecycle permission is limited to `esbuild`.
- No landing React integration, analytics SDK, external font, CMS, or client framework dependency added.
- Product copy is grounded in current repository behavior and explicitly retains development/daily-driver status.
- Temporary lockfile-generation workflow was removed before final integration.
- PR CI #219 passed the combined gate: root frozen install, lint, strict typecheck, 61 deterministic tests, WXT ZIP packaging, landing frozen install, and Astro static build.
- No extension runtime, persisted state, provider, permission, Graph mechanics, or filesystem contract changed.

## Blockers / Risks

- No known repository/CI blocker.
- Repository currently has no `LICENSE`; landing deliberately avoids claiming a specific open-source license until that decision is explicit.
- Keep future landing additions evidence-based; do not add fake social proof, unnecessary client runtime, or generic marketing sections merely to fill space.

## Next Action

Wait for an explicit next milestone outcome.

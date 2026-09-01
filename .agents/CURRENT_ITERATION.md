# Current Milestone

Status: **EXECUTING**

Goal: Ship a product-specific Astro landing page under `landing/` that explains Chatspace clearly to public repository visitors, demonstrates the real product model, provides a truthful source-install path, and preserves the product's local-first/provider boundaries.

Why: Chatspace now has a coherent daily-driver product shape but no dedicated public product surface. Repository visitors currently have to infer the experience from README text and source structure. The landing page should communicate the product in seconds without inventing capabilities, fake social proof, or generic AI/SaaS styling.

## Feature Compass

**Shape:** Chatspace remains a local-first Chromium Side Panel workspace beside native ChatGPT. The new landing page is a static public presentation surface only; it does not participate in extension runtime, persistence, provider integration, permissions, or filesystem behavior.

**Position:** M9 is executing. Astro scaffold, page structure, product mock, responsive visual system, and landing CI build coverage are being added on `m9-oss-landing`.

**Delta:** Add `landing/` as an Astro static site that communicates current product capabilities and boundaries, while leaving extension behavior unchanged.

**Next Move:** Generate and commit the standalone landing lockfile, run PR CI, fix any build/static issues, finalize evidence, and integrate only after gates pass.

## Scope

### In

- Astro static site under `landing/`;
- compact, clean, minimalist, restrained steel-blue visual language aligned with root `DESIGN.md`;
- product-specific hero showing Chatspace Side Panel beside native ChatGPT rather than generic decorative artwork;
- truthful Notes, Graph, Markdown Sync, local-first, provider-boundary, privacy/security, status, and install-from-source communication;
- responsive narrow/mobile behavior, keyboard focus, reduced-motion support, semantic structure, and light/dark themes;
- direct links to repository, privacy policy, and security policy;
- standalone landing dependency lock and deterministic landing build in CI;
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
- [ ] **Slice 3 — Reproducible build:** commit landing lockfile and make Astro static build part of CI.
- [ ] **Slice 4 — Cleanup and milestone gate:** remove temporary lockfile-generation workflow, inspect final diff, pass CI, finalize canonical state, and integrate.

## Current Decisions

- Landing page is a presentation surface, not a second application runtime.
- Astro is used without React/Tailwind/component-library integrations because the static page does not need client framework state and minimum dependency surface is preferred.
- The landing reuses Chatspace's neutral + desaturated steel-blue direction but owns its CSS locally; extension `cs-*` runtime tokens are not coupled across package boundaries.
- Product visuals are HTML/CSS/SVG representations of real Chatspace concepts rather than stock screenshots or unrelated decorative imagery.
- Public copy must distinguish repository/source availability from an OSS license until a `LICENSE` file exists.
- Root `DESIGN.md` remains the durable visual/product-experience authority. Root `SECURITY.md` and `PRIVACY.md` remain public-facing repository policies, not `.agents` authority files.

## Verification / Evidence

- Astro version pinned to `7.2.0`; Node boundary matches repo requirement (`>=22.12.0`).
- No landing React integration, analytics SDK, external font, CMS, or client framework dependency added.
- Landing CI build step added alongside existing extension quality gate.
- Final CI evidence pending.

## Blockers / Risks

- Landing dependency lockfile is not final until the temporary branch workflow generates it.
- Repository currently has no `LICENSE`; landing deliberately avoids claiming an open-source license.

## Next Action

Complete the reproducible landing build and milestone gate, then integrate M9 if CI is green.

# Chatspace Landing

Static Astro landing page for the public Chatspace product surface.

## Boundary

`landing/` is intentionally independent from the Chromium extension runtime. It explains the product and links to public repository policies; it does not share extension state, persistence, provider integration, permissions, filesystem access, or client framework code.

The parent repository does not include this directory in its pnpm workspace, so landing dependencies and lock state stay local to `landing/`.

## Development

Requirements: Node 22.12+ and pnpm 11.23.0.

From the repository root:

```bash
pnpm --dir landing --ignore-workspace install --frozen-lockfile
pnpm --dir landing dev
```

Build the static site with:

```bash
pnpm --dir landing build
```

Output is written to `landing/dist/`.

## Design constraints

- follow root `DESIGN.md` for durable Chatspace visual/product-experience direction;
- keep the public narrative grounded in `.agents/PROJECT.md` and current repository behavior;
- prefer product-specific composition over generic SaaS/AI landing patterns;
- no fabricated social proof, metrics, release status, store availability, or licensing claims;
- no analytics, cookies, forms, accounts, CMS, external fonts, or client framework dependency unless explicitly approved;
- preserve semantic structure, keyboard focus, reduced-motion handling, and intentional light/dark themes.

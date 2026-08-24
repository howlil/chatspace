# Chatspace Agent Entry Point

All agentic work in this repository is governed by `.agent/`.

Read in this order before changing code:

1. `.agent/README.md`
2. `.agent/PRODUCT.md`
3. `.agent/ARCHITECTURE.md`
4. `.agent/WORKFLOW.md`
5. The task-specific document referenced by `.agent/README.md`

## Non-negotiable defaults

- Optimize for small, independently testable increments and fast delivery.
- Use TDD for behavior changes: RED -> verify failure -> GREEN -> verify pass -> REFACTOR.
- Prefer simple, explicit boundaries over abstractions created for hypothetical future needs.
- Keep ChatGPT-specific DOM knowledge behind one compatibility adapter.
- Never call undocumented/private ChatGPT endpoints, reuse session cookies, bypass protections, or scrape/extract ChatGPT data/output programmatically.
- Treat OpenAI/website-policy compatibility as a product constraint, not an afterthought.
- Do not claim work is complete without fresh verification evidence.
- One active product increment at a time unless tasks are truly independent.
- Avoid opportunistic refactors outside the accepted scope.

## Product in one sentence

Chatspace is a local-first browser workspace layer that aims to make long AI conversations spatially navigable through folders, tabs, panels, notes, outlines, and graphs while keeping provider behavior outside Chatspace's ownership boundary.

See `.agent/README.md` for the full operating model.

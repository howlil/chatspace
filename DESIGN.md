# Design

`DESIGN.md` is the repository-level source of truth for durable Chatspace product-experience, interaction, and visual-design decisions.

It defines how Chatspace should feel, behave, and present information without depending on chat history, temporary implementation choices, or the current iteration.

It is not a feature spec, milestone plan, task checklist, changelog, component inventory, or replacement for `.agents/PROJECT.md` / `.agents/CURRENT_ITERATION.md`.

## Authority Boundaries

- `.agents/PROJECT.md` owns WHY, WHAT, product/domain behavior, user goals, feature scope, contracts, non-goals, and product constraints.
- `DESIGN.md` owns durable experience principles, information hierarchy, navigation principles, interaction behavior, UI-state behavior, responsive behavior, accessibility expectations, visual language, design tokens, component styling principles, theme behavior, and design-quality rules.
- `.agents/CURRENT_ITERATION.md` owns temporary/current design delta, active work, verification evidence, and next action.

Feature-specific details belong in `PROJECT.md` or the active iteration unless they become durable product-wide design rules.

## Canonical Direction

Chatspace is:

**compact, clean, minimalist, smooth, and selectively glassmorphic.**

The product should feel like a focused modern engineering workspace rather than a decorative AI dashboard.

Priorities, in order:

1. usability and information clarity;
2. hierarchy and navigation speed;
3. compact information density;
4. interaction quality and motion continuity;
5. visual refinement;
6. selective glass/depth effects.

Distinctiveness should come primarily from composition, typography, proportion, spacing, interaction quality, and disciplined surface treatment—not generic glow, excessive gradients, or ornamental effects.

## Product Experience

Chatspace lives beside native ChatGPT in the browser Side Panel. The Side Panel should feel like a compact editor/workspace: dense enough for serious daily use, but visually calm and easy to scan.

Native ChatGPT must remain visually and functionally independent. Chatspace must not simulate or visually compete with the provider conversation surface.

## Information Hierarchy

Use hierarchy through:

1. typography;
2. spacing;
3. grouping and alignment;
4. dividers/borders;
5. controlled surface contrast;
6. restrained elevation/glass treatment;
7. semantic color only when it adds meaning.

Do not use color, glow, or blur to compensate for weak structure.

Primary work content should dominate. Navigation, metadata, status, and secondary context should remain subordinate.

## Navigation Principles

- navigation state must be immediately understandable;
- selected/active context is clear but not visually loud;
- hierarchy and location should be discoverable without permanent chrome everywhere;
- repeated actions should behave consistently across mouse, keyboard, and command surfaces;
- global actions must have stable semantics independent of incidental selection;
- secondary controls should appear when relevant rather than permanently occupying space.

## Interaction Behavior

Interactions should feel direct and smooth.

- avoid unnecessary modal or multi-step friction;
- use motion to preserve spatial/causal continuity, not decoration;
- state changes should be fast and visually legible;
- destructive operations require clear confirmation;
- loading, unavailable, empty, error, reconnect, recovery, and disabled states must be explicit;
- no important action may depend only on hover.

Motion should be short, restrained, and interruptible. Avoid exaggerated springiness or showpiece animation.

## Layout and Responsive Behavior

The browser may make the Side Panel narrow.

- preserve the primary work surface first;
- allow navigation surfaces to collapse before the work area becomes unusable;
- prefer overflow or stacking over multiple tiny permanent columns;
- controls may wrap when necessary without dominating content;
- secondary inspectors/context should remain bounded and scroll independently when appropriate.

Responsive behavior must preserve task completion, not merely fit pixels.

## Accessibility

Minimum durable expectations:

- keyboard-reachable core workflows where applicable;
- visible focus treatment;
- semantic controls and labels;
- accessible names for icon-only controls;
- understandable toggle/pressed/selected states;
- sufficient contrast in light and dark themes;
- no required hover-only interactions;
- destructive actions are explicit;
- motion should not be required to understand state.

## Visual Language

Use a restrained modern workspace language:

- compact spacing;
- clean geometry;
- consistent radii;
- thin borders/dividers;
- subtle depth;
- crisp typography;
- limited accent usage;
- selective translucent/glass surfaces where depth or layering benefits comprehension.

The canonical secondary/accent direction is **desaturated steel blue** over otherwise neutral workspace surfaces. Use it for selected/active context, focus treatment, graph/reference emphasis, and similarly meaningful state—not as a wash over ordinary panels or content. Hover may carry only a slight cool tint so active state remains clearer than incidental pointer state.

Current reference values:

- dark: `cs-hover #19202a`, `cs-active #1b2636`, `cs-focus #7fa6c9`;
- light: `cs-hover #f0f4f8`, `cs-active #e8eef6`, `cs-focus #4f7396`.

Do not introduce saturated electric blue, purple-blue gradients, or blue glow to amplify this accent. The steel blue should remain subordinate to content and typography.

Glassmorphism is an accent, not the entire interface. Use it selectively for layered shell/overlay/floating contexts where translucency communicates hierarchy. Avoid glass on every card or row.

Avoid “AI slop” styling:

- excessive purple/blue gradients;
- neon glow;
- shiny gradient borders everywhere;
- giant rounded cards without structural purpose;
- excessive pills;
- decorative blobs/orbs;
- gratuitous sparkles;
- excessive whitespace that reduces workspace density.

## Tokens and Theming

Use semantic `cs-*` design tokens rather than feature-local hard-coded theme colors.

Current semantic primitives include:

```text
cs-bg
cs-panel
cs-surface
cs-raised
cs-border
cs-control
cs-hover
cs-active
cs-focus
cs-primary
cs-primary-contrast
cs-text
cs-muted
cs-subtle
cs-danger
```

Components should express semantic intent and allow the theme layer to supply concrete values.

Support explicit light and dark modes. Persist explicit user preference. Use system preference only as the initial fallback when no explicit choice exists.

Light mode and dark mode are both designed surfaces; neither should be treated as a mechanical inversion of the other.

## Component Styling Principles

- Radix UI Primitives is the default interaction foundation for reusable complex controls; Chatspace styling remains token-driven and product-specific;
- use Radix behavior without importing a generic visual theme that overrides Chatspace hierarchy or tokens;
- reuse existing tokens/primitives before adding new visual concepts;
- keep component appearance proportional to its importance;
- iconography uses Lucide for UI affordances;
- icon-only controls require accessible names/tooltips;
- controls with the same semantic action should share behavior and visual language;
- avoid permanent action chrome on every row when contextual discovery is sufficient;
- do not introduce one-off shadows, gradients, radii, or colors when semantic tokens can express the intent.

## Public Surface Anti-AI-Slop Rule

Chatspace public surfaces must prefer **product evidence over marketing decoration**.

Every public section must earn its existence by explaining a real capability, workflow, boundary, project state, or user action. Do not add a section merely because SaaS or AI landing pages conventionally contain one.

Public copy follows **literal first, personality second**:

- prefer nouns and verbs tied to real Chatspace behavior over abstract benefit language;
- explain what the product does before trying to sound memorable;
- keep manifesto/tagline-style writing scarce; one distinctive line is stronger than repeated polished aphorisms;
- avoid repeating the same local-first/provider claim across hero, features, trust, install, and closing surfaces;
- use `ChatGPT` in public-facing narrative when that is the concrete concept; reserve internal terms such as provider adapter, canonical state, provenance, and integration ownership for documentation unless they materially establish trust;
- do not use meta-writing that explains why the page itself chose certain wording;
- avoid generic AI/SaaS vocabulary such as “supercharge”, “unlock”, “reimagine”, “revolutionary”, “next-generation”, “seamless”, or “your AI workspace” unless the literal product behavior requires the word.

Public composition rules:

- prefer actual, sanitized product UI as the primary proof when an appropriate capture exists;
- a stylized product representation must map to real current behavior and must never imply unavailable capability;
- do not substitute generated decorative product imagery for product evidence;
- use numbering only for an actual sequence or ordered concept;
- use arrows or external-link marks only when they communicate a real action or navigation;
- avoid metric strips without meaningful metrics, fake testimonial/logo walls, repeated numbered grids, an eyebrow on every section, giant closing CTA blocks, ambient halos/orbs, decorative grids, excessive glass, and cards created only to occupy layout;
- a floating/sticky shell may use restrained glass when translucency communicates layering; ordinary content surfaces should remain structurally simple;
- as product clarity improves, the landing should become shorter rather than accumulating new marketing sections.

For the public landing, default narrative priority is approximately:

1. product/use case;
2. concrete features and workflow;
3. trust/data ownership boundaries;
4. installation and repository status.

## Design Quality Rule

A design change is complete when the affected surface:

- improves or preserves task clarity;
- preserves native ChatGPT usability;
- remains understandable at narrow Side Panel widths;
- has clear interaction and UI states;
- remains keyboard/accessibility sound where applicable;
- works intentionally in light and dark themes;
- uses glass/depth effects only when they improve hierarchy;
- does not add decorative complexity without product value.

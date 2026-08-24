# Skill: UI & Interaction Design

Use for any new workspace surface, meaningful visual change, tree/tab/graph interaction, responsive behavior, or design-system primitive.

## Objective

Create a compact spatial work surface that improves navigation without turning Chatspace into a decorative AI dashboard.

## Procedure

### 1. Start from user task

State:

```text
User is trying to:
Current friction:
Primary action:
Secondary actions:
Information needed at decision time:
```

If the answer is only "make it look better", inspect the workflow first.

### 2. Identify surface role

Choose one:

- navigation
- editing
- inspection/detail
- command/action
- status/error

Do not make every surface a card.

### 3. Preserve workspace hierarchy

For the main shell:

```text
left = organize/navigate
center = inspect/create spatial artifact
right = active conversation/provider context
```

A feature should have a clear home. Avoid duplicate controls across all panels.

### 4. Sketch interaction states before styling

Define at least:

- default
- hover if useful (never sole affordance)
- selected/active
- keyboard focus
- empty
- loading if applicable
- error/degraded
- narrow/collapsed

For destructive actions define undo/confirmation behavior.

### 5. Keyboard path

Write the keyboard-only path for the main workflow before implementation.

Example:

```text
Cmd/Ctrl+K -> "Create folder" -> Enter -> name -> Enter -> folder selected
```

Tree/tabs should follow established keyboard semantics rather than inventing shortcuts.

### 6. Use design tokens

No one-off hard-coded theme colors in feature components. Reuse semantic tokens from `DESIGN_SYSTEM.md`.

Add a token only when it represents a reusable semantic role, not one component's aesthetic preference.

### 7. Build smallest visual primitive

Prefer native semantic HTML and project-owned styling. Adopt a dependency only when behavior/accessibility complexity justifies it.

Do not bootstrap a large component library for one popover.

### 8. Component behavior test first

For meaningful interactions, write component/feature behavior test before implementation:

- keyboard navigation
- selection
- collapse
- focus return
- persisted layout command

Pure visual details can be verified through visual/manual review where a behavior test adds no value.

### 9. Implement density intentionally

Check:

- labels do not wrap unnecessarily
- secondary metadata is visually subordinate
- row heights support scanning
- icon buttons are not always visible everywhere
- borders/surfaces are used for hierarchy, not decoration

### 10. Host coexistence check

For injected surfaces:

- no global CSS leakage
- no duplicate mount
- critical host controls remain accessible
- hide/disable Chatspace restores usable host layout
- host light/dark mode remains readable

### 11. Narrow layout

Do not squeeze all three panels indefinitely. Define collapse priority and preserve the primary conversation surface.

### 12. Visual evidence

For review, provide screenshot/video when practical showing:

- primary state
- narrow/collapsed state
- dark/light if both supported
- error/degraded state when relevant

## Graph-specific rules

A graph must answer a navigation/relationship question.

Before adding a node/edge, define:

```text
Node meaning:
Edge meaning:
Source/provenance:
Click action:
Keyboard/non-hover action:
```

Graph anti-patterns:

- rainbow node types without hierarchy
- thousands of nodes by default
- edges without meaning/provenance
- hover-only details
- graph as a prettier duplicate of the folder tree

## UI review checklist

- main action clear?
- user can recover/undo?
- keyboard path works?
- focus remains logical?
- empty/error state useful?
- narrow width safe?
- host unaffected when Chatspace hidden?
- no unnecessary animation/elevation?
- same command logic shared across entry points?

## Output

```text
Workflow changed:
Interaction model:
States handled:
Accessibility evidence:
Visual evidence:
Known UX limitation:
```

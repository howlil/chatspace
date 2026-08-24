# Skill: Safe Refactoring

Use when changing structure without intentionally changing observable behavior.

## Preconditions

Refactor only when there is a concrete reason:

- duplication is causing repeated edits/bugs
- responsibilities are mixed
- provider knowledge leaked across boundary
- file/module is hard to test/understand
- upcoming accepted feature is blocked by current structure

Do not refactor because a different architecture looks prettier.

## Procedure

### 1. State invariant behavior

List what must remain unchanged.

### 2. Establish tests/evidence

Run the smallest suite that proves current behavior before changing structure.

If behavior lacks coverage and matters, add characterization tests first.

### 3. Define one structural objective

Examples:

- move ChatGPT selectors behind adapter
- extract pure graph projection from renderer
- split persistence migration from repository I/O

Avoid "clean up architecture" as scope.

### 4. Make smallest structural move

Keep public interfaces stable where possible.

### 5. Verify after each meaningful move

Run focused tests/typecheck. Do not accumulate a giant unverified rename/move diff.

### 6. Delete old path

No parallel old/new implementations left "temporarily" unless a migration strategy explicitly requires it.

### 7. Full affected verification

Behavior tests must remain green. Build/typecheck as applicable.

## Refactor boundaries

### Good extractions
- pure domain transform
- adapter around external API/DOM
- cohesive UI primitive used by real features
- repository boundary around persistence

### Suspicious extractions
- one interface + one implementation with no boundary benefit
- generic event bus for a few direct calls
- abstract factory for one provider
- utility module full of unrelated helpers

## Output

```text
Reason:
Behavior held constant:
Structural change:
Evidence before:
Evidence after:
Removed duplication/leak:
```

# Animation Tasks - Quran App (Yaqeen) Intro

## Workflow Rules

- Source Of Truth: .gsap artifacts
- Execution Style: one phase at a time
- Parallelism Rule: do not implement multiple major sections in one unchecked pass
- Update Rule: after each phase, update page, plan, and tasks artifacts
- Active Phase: None (Completed)

## Current Queue

| Phase | Page | Section | Goal | Status |
|------|------|---------|------|--------|
| Phase 1 | Layout | Intro Overlay | Build and integrate the new GSAP animated splash/intro in AppInitializer | Completed |

## Active Phase Checklist

- [x] Read the page artifact and phase file
- [x] Confirm section objective and recipe
- [x] Inspect current source code before editing (`AppInitializer.tsx`)
- [x] Implement the new GSAP Intro component
- [x] Add the GSAP timeline animation logic
- [x] Implement mobile downgrade and reduced-motion rules
- [x] Connect with session storage so it triggers only once per tab session
- [x] Verify there are no typescript/compilation errors
- [x] Update tasks and pages artifacts with completion status

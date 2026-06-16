# Animation Plan - Quran App (Yaqeen)

## Workflow State

- Current Mode: gsap-new
- Resume State: Completed Phase 2
- Last Updated By: Antigravity
- Active Phase: None (Completed)

## Target Scope

- Pages: Root / App Layout (`src/components/AppInitializer.tsx`)
- Primary Goal: Replace the static loading splash with a premium, high-fidelity GSAP animated intro that only triggers once per session.
- Constraints: Maintain Next.js compatibility, ensure performance on low-end mobile devices, and support reduced-motion configurations.

## Implementation Order

1. Setup and verify GSAP library import and types.
2. Design the SVG elements for the calligraphy logo and geometric patterns.
3. Build the animated intro overlay component inside `AppInitializer.tsx` or as a separate component.
4. Implement the GSAP timeline animation (drawing lines -> typography fade -> overlay fadeout).
5. Add session controls (`sessionStorage`) and a skip button.
6. Verify mobile performance and reduced-motion fallback.

## Recipes By Section

| Page | Section | Recipe | Status | Notes |
|------|---------|--------|--------|-------|
| Layout | Intro Overlay | GSAP Timeline (Draw SVG -> Scale Logo -> Fade Typography -> Clip-Path Slide Out) | Completed | Will replace the existing Tailwind/CSS splash screen. |
| Admin | Intro Overlay | GSAP Timeline (Elastic entrance -> Staggered text -> Scale/Fade exit) | Completed | Triggers on successful admin login. |

## Phases

| Phase | Page | Section | Objective | Recipe | Status |
|------|------|---------|-----------|--------|--------|
| Phase 1 | Layout | Intro Overlay | Implement the core GSAP intro timeline, SVG drawing, session detection, and smooth transition. | GSAP Timeline (Staggered draw + fade out) | Completed |
| Phase 2 | Admin | Intro Overlay | Build and integrate a 5-second GSAP animated intro for the Admin Panel | GSAP Timeline (Elastic entrance + staggered text) | Completed |

## Validation Checklist

- [x] Reduced motion covered (falls back to simple opacity transition)
- [x] Mobile-heavy effects reviewed (glow and rotation animations disabled on mobile)
- [x] Existing code inspected before changes (read `AppInitializer.tsx` splash code)
- [x] Page artifact updated after implementation
- [x] Tasks file created
- [x] Phase files created

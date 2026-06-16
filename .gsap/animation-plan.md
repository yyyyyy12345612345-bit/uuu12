# Animation Plan - Quran App (Yaqeen)

## Workflow State

- Current Mode: gsap-new
- Resume State: Completed Phase 2 (World Cup Legend Upgrade)
- Last Updated By: Antigravity
- Active Phase: None (Completed)

## Target Scope

- Pages: Root / App Layout (`src/components/AppInitializer.tsx`), Admin Panel (`src/components/AdminPanel.tsx`)
- Primary Goal: High-fidelity animated entry portals on load.
- Constraints: Maintain Next.js compatibility, ensure performance on low-end mobile devices, and support reduced-motion configurations.

## Implementation Order

1. Setup and verify GSAP library import and types.
2. Design the SVG elements for the calligraphy logo and geometric patterns.
3. Build the animated intro overlay component inside `AppInitializer.tsx`.
4. Implement the GSAP timeline animation in both pages.
5. Upgrade Admin intro to legendary World Cup theme (Fireworks, Orbiting Spheres, SVG Trophy, F5 Refresh).
6. Verify mobile performance and reduced-motion fallback.

## Recipes By Section

| Page | Section | Recipe | Status | Notes |
|------|---------|--------|--------|-------|
| Layout | Intro Overlay | GSAP Timeline (Draw SVG -> Scale Logo -> Fade Typography -> Clip-Path Slide Out) | Completed | Replaced the existing Tailwind/CSS splash screen. |
| Admin | Intro Overlay | GSAP Timeline (World Cup Trophy -> Orbiting Spheres -> Staggered Fireworks -> Scale/Fade exit) | Completed | Runs on every admin page load/refresh. |

## Phases

| Phase | Page | Section | Objective | Recipe | Status |
|------|------|---------|-----------|--------|--------|
| Phase 1 | Layout | Intro Overlay | Implement the core GSAP intro timeline, SVG drawing, session detection, and smooth transition. | GSAP Timeline (Staggered draw + fade out) | Completed |
| Phase 2 | Admin | Intro Overlay | Build and integrate a legendary 5-second GSAP animated intro for the Admin Panel | GSAP World Cup & Fireworks Timeline | Completed |

## Validation Checklist

- [x] Reduced motion covered (falls back to simple opacity transition)
- [x] Mobile-heavy effects reviewed (glow and rotation animations disabled on mobile)
- [x] Existing code inspected before changes (read `AppInitializer.tsx` splash code)
- [x] Page artifact updated after implementation
- [x] Tasks file created
- [x] Phase files created

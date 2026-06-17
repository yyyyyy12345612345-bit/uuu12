# Animation Tasks - Admin Panel Intro

## Workflow Rules

- Source Of Truth: .gsap artifacts
- Execution Style: one phase at a time
- Parallelism Rule: do not implement multiple major sections in one unchecked pass
- Update Rule: after each phase, update page, plan, and tasks artifacts
- Active Phase: None (Completed)

## Current Queue

| Phase | Page | Section | Goal | Status |
|------|------|---------|------|--------|
| Phase 1 | AdminPanel | Admin Intro | Build and integrate a 5-second GSAP animated intro for the Admin Panel | Completed |
| Phase 2 | AdminPanel | World Cup Upgrade | Upgrade intro to World Cup theme with fireworks, orbiting spheres, and F5 compatibility | Completed |
| Phase 3 | AdminPanel | 3D WebGL Upgrade | Re-engineer intro using React Three Fiber, custom shaders, dynamic GPU particles and GSAP | Completed |

## Active Phase Checklist

- [x] Install dependencies in package.json (Three, R3F, Drei)
- [x] Create preloader with liquid golden glow text shader
- [x] Create procedurally styled 3D Football (carbon panels, neon seams shader)
- [x] Create GPU particle nebula system in canvas
- [x] Implement mouse attraction/repulsion on GPU + camera parallax
- [x] Script hyper-drive zoom + speed-stretching + Vignette/Chromatic Aberration overlays
- [x] Script supernova explosion + expanding shockwave ring
- [x] Script vortex reassembly into Islamic 8-point star and trophy silhouette
- [x] Script drift of particles to UI layout edges
- [x] Integrate into AdminPanel.tsx, adding GSAP staggered cards entry
- [x] Check performance on mobile and reduced motion compliance

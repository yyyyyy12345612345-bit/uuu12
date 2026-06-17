# Animation Plan - Quran App (Yaqeen)

## Workflow State

- Current Mode: gsap-new
- Resume State: In Progress - Phase 3 (3D WebGL World Cup Intro Upgrade)
- Last Updated By: Antigravity
- Active Phase: Phase 3 (3D WebGL World Cup Intro Upgrade)

## Target Scope

- Pages: Root / App Layout (`src/components/AppInitializer.tsx`), Admin Panel (`src/components/AdminPanel.tsx`)
- Primary Goal: Mind-blowing interactive 3D WebGL entry portal on Admin load.
- Constraints: React 19 compatibility (R3F v9), smooth 60+ FPS on GPU, support mobile downgrade (reduce particles to 20,000, disable post-processing), and support reduced-motion.

## Implementation Order

1. Setup and verify GSAP library import and types.
2. Add Three.js, React Three Fiber, and @react-three/drei dependencies to `package.json`.
3. Update `.gsap` configuration and specifications.
4. Implement `WorldCup3DIntro.tsx` containing:
   - Custom shader preloader.
   - 3D Football with Matte Carbon Fiber panels and glowing seams (Gold, Crimson, Blue).
   - Particle nebula with mouse attraction/repulsion.
   - Hyper-drive trigger (zoom-in + speed lines + Chromatic Aberration).
   - Supernova explosion (expanding shockwave ring + radial blast).
   - Vortex reassembly (Islamic star logo + trophy silhouette + edge drift).
   - Skip Intro button.
5. Integrate component into `AdminPanel.tsx` and coordinate dashboard HTML/CSS cards stagger animation.
6. Verify performance, mobile fallback, and prefers-reduced-motion fallback.

## Recipes By Section

| Page | Section | Recipe | Status | Notes |
|------|---------|--------|--------|-------|
| Layout | Intro Overlay | GSAP Timeline (Draw SVG -> Scale Logo -> Fade Typography -> Clip-Path Slide Out) | Completed | Replaced the existing Tailwind/CSS splash screen. |
| Admin | Intro Overlay | 3D WebGL (R3F + Custom Shader Football + GPU Particles -> Zoom -> Explode -> Reassemble) | In Progress | Replacing the SVG-based admin intro. |

## Phases

| Phase | Page | Section | Objective | Recipe | Status |
|------|------|---------|-----------|--------|--------|
| Phase 1 | Layout | Intro Overlay | Implement the core GSAP intro timeline, SVG drawing, session detection, and smooth transition. | GSAP Timeline (Staggered draw + fade out) | Completed |
| Phase 2 | Admin | Intro Overlay | Build and integrate a legendary 5-second GSAP animated intro for the Admin Panel. | GSAP World Cup & Fireworks Timeline | Completed |
| Phase 3 | Admin | Intro Overlay | Upgrade to full interactive 3D WebGL experience using R3F, Drei, and custom GPU shaders. | R3F 3D Football + GPU Particle Vortex | In Progress |

## Validation Checklist

- [ ] Reduced motion covered (instantly skips WebGL canvas to dashboard)
- [ ] Mobile-heavy effects reviewed (downscale particles to 20,000, disable post-processing)
- [ ] Existing code inspected before changes (read `AdminPanel.tsx` intro)
- [ ] Page artifact updated after implementation
- [ ] Tasks file created
- [ ] Phase files created

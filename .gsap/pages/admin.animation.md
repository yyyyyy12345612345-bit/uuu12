# Page Animation Spec - Admin Panel World Cup Intro

## Page

- Page Route: `/admin` (Admin Panel)
- Source File: `src/components/AdminPanel.tsx`
- Page Status: Completed (Upgraded to Legendary)

## Resume State

- Next Agent Action: None (Upgraded to Legendary)
- Blocking Questions: None
- Discovery Confidence: High
- Active Phase: Phase 2 (Completed)

## Sections

### Admin Intro Overlay
- Type: Overlay entrance and transition
- Elements: Outer wrapper div with dark radial gold gradient background, containing background firework emitters.
- Animation: Fades out and slides up on completion or skip.
- Status: Completed (Runs on every page F5 refresh)

### World Cup Trophy
- Type: Centerpiece graphic SVG
- Elements: High-fidelity custom SVG World Cup Trophy with metallic gold gradients and malachite green bands, plus double-layered rotating accent rings.
- Animation: Entrance zoom and bounce (`y: [30, 0], scale: [0.5, 1], opacity: [0, 1]`).
- Status: Completed

### Orbiting Soccer Spheres
- Type: 3D Elliptical Orbit Simulation
- Elements: 3 golden spheres representing mini soccer balls.
- Animation: Traced elliptical paths computed via trigonometric GSAP loops:
  - Ball 1: Horizontal orbit (`x = cos(a)*150, y = sin(a)*20`).
  - Ball 2: 45-degree rotated orbit (`x_raw = cos(a)*130, y_raw = sin(a)*30`).
  - Ball 3: -45-degree rotated orbit (`x_raw = cos(a)*140, y_raw = sin(a)*25`).
  - 3D Depth: Automatically toggles scale (from 0.65 to 1.35) and zIndex (5 when behind, 25 when in front) using `Math.sin(a)`.
- Status: Completed

### Fireworks Backdrops
- Type: Celebrative fireworks
- Elements: 3 background SVGs positioned left, right, and top-center.
- Animation: Staggered loops generating radial explosion lines that expand outward (`x = cos(i*pi/6)*55, y = sin(i*pi/6)*55`) and fade to `opacity: 0` inside an infinite loop.
- Status: Completed

## Mobile Rules

- Simplifications: Remove fireworks and orbiting spheres for performance. Keep only the central trophy zoom and text stagger.
- Disabled Effects: Glow drop-shadow filters on mobile width.

## Reduced Motion

- Fallback Behavior: Immediate fade and skip transition.

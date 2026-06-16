# Page Animation Spec - Intro Overlay

## Page

- Page Route: Root (Global Layout)
- Source File: `src/components/AppInitializer.tsx`
- Page Status: Completed

## Resume State

- Next Agent Action: None (Implemented)
- Blocking Questions: None
- Discovery Confidence: High
- Active Phase: None (Completed)

## Sections

### Intro Background & Rings
- Type: Ambient background & Rotating/Pulsing circles
- Elements: SVG geometric stars/rings and dark radial gradient background
- Animation: Gentle rotating (`rotation: 360, repeat: -1, ease: "none", duration: 20`) and scale pulsing (`scale: 1.05, repeat: -1, yoyo: true`)
- Status: Completed

### Logo & Calligraphy Draw
- Type: SVG Stroke Draw
- Elements: SVG paths of the logo / calligraphy text
- Animation: Draw effect using `strokeDashoffset` from length to 0, followed by a glowing fill fade-in
- Status: Completed

### Typography Reveal
- Type: Staggered Fade Up
- Elements: Heading "قرآن كريم" and subtitle text
- Animation: Staggered reveal from `y: 20`, `opacity: 0` to `y: 0`, `opacity: 1` using `stagger: 0.1` and `ease: "power2.out"`
- Status: Completed

### Exit Transition
- Type: Screen Reveal (Slide-up or Fade-out)
- Elements: Entire intro wrapper overlay
- Animation: Exit slide-up or scale-up with fade-out (`y: "-100%", opacity: 0, duration: 0.8, ease: "power3.inOut"`)
- Status: Completed

## Mobile Rules

- Simplifications: Disable the SVG drawing animations and SVG rotation to preserve CPU/GPU cycles.
- Disabled Effects: Glow/blur filters and particle/ring animations. Display simple logo scaling and text fade-in.

## Reduced Motion

- Fallback Behavior: Skip the drawing and sliding exit completely. Just display the logo for 1.2 seconds and fade it out using a standard 0.4s fade-out.

## Phase Status

| Phase | Section | Recipe | Status | Notes |
|------|---------|--------|--------|-------|
| Phase 1 | Intro Overlay | GSAP Timeline (Draw -> Text reveal -> Exit slide-up) | Completed | Will replace default Next.js splash overlay. |

# Page Animation Spec - Admin Panel Intro

## Page

- Page Route: `/admin` (Admin Panel)
- Source File: `src/components/AdminPanel.tsx`
- Page Status: Completed

## Resume State

- Next Agent Action: None (Implemented)
- Blocking Questions: None
- Discovery Confidence: High
- Active Phase: None (Completed)

## Sections

### Admin Intro Overlay
- Type: Overlay entrance
- Elements: Outer wrapper div with dark radial gold gradient background
- Animation: Exit scale up and fade out (`scale: 1.05, opacity: 0, duration: 0.6, ease: "power3.inOut"`)
- Status: Completed

### Intro Card
- Type: Entrance card
- Elements: Glassmorphic center container
- Animation: Scale and fade in (`scale: [0.85, 1], opacity: [0, 1], duration: 0.8, ease: "power3.out"`)
- Status: Completed

### Diagnostic Icon
- Type: Entrance & Loop
- Elements: Glowing ShieldCheck container and dashed circle border
- Animation: Rotate and scale entrance (`rotation: [-45, 0], scale: [0.5, 1], opacity: [0, 1], duration: 0.8, ease: "back.out(2)"`). Dashed circle rotates continuously (`rotation: 360, repeat: -1, ease: "none", duration: 20`).
- Status: Completed

### Typo Stagger
- Type: Staggered reveal
- Elements: Badge text, portal title, loading description
- Animation: Staggered fade and slide up (`y: 15, opacity: 0` to `y: 0, opacity: 1, duration: 0.6`)
- Status: Completed

## Mobile Rules

- Simplifications: Remove dashed circle rotation. Keep standard fade-in without elastic bounce.
- Disabled Effects: Glow dropshadow filters.

## Reduced Motion

- Fallback Behavior: Fast fade out after 1.2s delay. Skip entrance bounces.

## Phase Status

| Phase | Section | Recipe | Status | Notes |
|------|---------|--------|--------|-------|
| Phase 1 | Admin Intro Overlay | GSAP Timeline (Entrance -> Delay -> Slide out) | Completed | Triggers only once per session on successful admin login. |

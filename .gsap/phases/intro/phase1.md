# Phase 1 - Intro Overlay Animation

## Scope

- Page: Intro Overlay
- Section: Entire Splash Page
- Recipe Direction: GSAP Autoplay Timeline + SVG Path Draw + Staggered text + Screen reveal exit
- Status: Active

## Objective

Create a premium, smooth spiritual animated splash screen using GSAP that runs on initial page load, and once finished, reveals the main site using a smooth fade-out or slide-up transition. Store state in sessionStorage so it only shows once per tab session.

## Tasks

- [ ] Create a custom, styled SVG for the intro logo featuring "يقين" calligraphy or geometric Islamic star pattern.
- [ ] Import `gsap` library in `AppInitializer.tsx`.
- [ ] Implement a GSAP timeline inside a `useLayoutEffect` or `useEffect` hook.
- [ ] Build the overlay UI: dark spiritual gradient, golden highlights, skip button, and responsive layout.
- [ ] Program the GSAP timeline:
  - Animate background aura.
  - Draw SVG paths (stroke animation).
  - Fade-in/slide-up text title and subtitle.
  - Slide/fade-out the whole overlay screen at the end of the timeline.
- [ ] Add `sessionStorage` guard so it's only displayed once per session.
- [ ] Code mobile-friendly responsive design and fallback rules.
- [ ] Add `prefers-reduced-motion` detection and instant/simplified fade fallback.

## Validation

- Reduced Motion: Test with system prefers-reduced-motion set to true; check if it fades out instantly.
- Mobile Downgrade: Validate responsiveness and ensure glow/blur animations are deactivated on screen widths < 768px.
- Notes: Make sure the transition does not break layout or cause layout shifts.

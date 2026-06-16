# Animation Spec - Quran App (Yaqeen)

## Workflow State

- Owner Workflow: gsap-new
- Source Of Truth: .gsap artifacts
- Resume Rule: Read these files before asking new questions

## Philosophy

- Personality: Spiritual, Elegant & Deep (وقار وسكينة)
- Density: Minimal to Moderate (High impact but clean)
- Scroll Behavior: Timeline-based autoplay (Intro) transitioning to main page entry.

## Global Effects

- [ ] Smooth page transition (Intro fade-out)
- [x] Arabic Calligraphy line drawing (SVG Stroke dashoffset)
- [x] Glowing aura/particle fade
- [x] Staggered typography reveals (letters or words fade-in)

## Performance Rules

- Device Priority: Mobile-first
- Reduced Motion: Required (respect `prefers-reduced-motion` and fall back to a simple, fast opacity fade-in/out).
- Heavy Effects On Mobile: Disabled (disable glowing aura and rings on mobile; display only clean typography and logo fade).
- Preferred Animated Properties: transform (scale, translate), opacity, stroke-dashoffset.

## Project Intelligence

- Inferred Archetypes: Spiritual, Educational, Interactive Utility
- Supporting Infrastructure: Next.js + TailwindCSS (for base layout) + GSAP (for high-fidelity web animations)
- Project Constraints: Must run smoothly on mobile and web viewports. Only show once per session using `sessionStorage`.

## Decisions & Configuration

- **Brand references**: Islamic geometry, gold (#fbbf24) gradients, dark spiritual blue/charcoal background (#0d111d).
- **Core Elements to Animate**:
  - Logo container (scale + fade-in).
  - Arabic Calligraphy SVG "يقين قرآن" (stroke line drawing).
  - Subtitle ("المصحف الإلكتروني والأذكار") (staggered fade-up).
  - Decorative SVG geometric rings (pulsing/rotating scale).
  - Intro overlay (slide-up or fade-out clip-path to reveal main application).
- **Mobile Downgrade**: Remove SVG stroke-drawing animation if it lags, or reduce rings opacity and disable rotation.
- **Reduced Motion Fallback**: Instant skip to main screen or simple 500ms global fade-out.

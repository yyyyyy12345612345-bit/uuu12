# Phase 1 - Admin Panel Intro Overlay

## Scope

- Page: Admin Panel
- Section: Admin Intro Overlay
- Recipe Direction: GSAP Autoplay Timeline + Elastic scale-in + Staggered reveal + Scale-out exit
- Status: Active

## Objective

Build a premium, satisfying 5-second entry animation for the Admin Panel. It triggers once per session when the user is successfully identified/logged in as administrator, giving a high-end transition before loading the main management dashboard.

## Tasks

- [ ] Import `gsap` library and `SkipForward` icon in `AdminPanel.tsx`.
- [ ] Define state `showAdminIntro` and refs (`adminIntroOverlayRef`, `adminIntroCardRef`, `adminIntroIconRef`, `adminIntroTextRef`).
- [ ] Set up `useEffect` to trigger `showAdminIntro = true` on `isAdmin = true` if not seen in the current tab session.
- [ ] Construct the GSAP timeline with custom elastic back eases and staggered animations.
- [ ] Build the overlay UI: glassmorphism card, glowing shield check icon, rotating border, loading progress bar, and "Skip" button.
- [ ] Bind skip handler to kill animations and immediately transition to the admin dashboard.
- [ ] Add mobile optimizations and reduced-motion fallback rules.

## Validation

- Reduced Motion: Check if timeline falls back to simple fade-out on reduced motion settings.
- Mobile Downgrade: Disable rotation and heavy glow drop-shadow filters on mobile widths.
- Timing: Ensure the timeline duration is set to 5 seconds.

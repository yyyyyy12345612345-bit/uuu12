# Page Animation Spec - Admin Panel 3D World Cup WebGL Intro

## Page

- Page Route: `/admin` (Admin Panel)
- Source File: `src/components/AdminPanel.tsx`
- Component File: `src/components/WorldCup3DIntro.tsx`
- Page Status: In Progress (Upgrading to 3D WebGL)

## Cinematic Stages

### 1. Preloader Stage
- Background: Pitch-black (`#000000`).
- Text: Bold, futuristic "LOADING" text in the center.
- Effect: Custom liquid golden glow shader filling the text from 0% to 100% based on simulated assets load.

### 2. Interactive Football Stage
- Object: Procedural 3D Football Mesh.
- Materials:
  - Panels: Matte Black Carbon Fiber (via high-frequency sine/step shader).
  - Seams: Custom GLSL Shader creating pulsing neon glow blending Gold, Crimson, and Blue (World Cup theme).
  - Animation: Slow, steady rotation on its axis.
- Environment: Dynamic particle system (100,000 dust/nebula particles).
- Interaction:
  - Mouse Tracking: Particles are repelled/attracted by the cursor (fluid-dynamics simulation on GPU).
  - Parallax: Camera translates slightly in response to mouse coordinates.

### 3. Hyper-Drive Stage
- Trigger: User click, scroll, or automatic timeout after 4 seconds.
- Animation:
  - Ball rotation pauses for 0.5s.
  - Seam glow flashes to maximum intensity (emissive boost).
  - Camera pulls back slightly, then zooms forward through the ball at high velocity.
  - Particles stretch into radial "speed lines" along their velocity vectors on the GPU.
  - Screen-space Chromatic Aberration & Vignette effects overlay to simulate extreme velocity.

### 4. Supernova Explosion Stage
- Timing: Triggered milliseconds before the ball hits the camera view.
- Animation:
  - The football mesh is hidden.
  - Radial shockwave ring expands from the center, applying a temporary refraction/blur post-processing distortion.
  - Explode millions of golden particles into 3D space, decelerating smoothly via damping forces on the GPU.

### 5. Vortex Reassembly & UI Transition
- Animation:
  - Particles undergo a gravity-vortex pull and reassemble to form the Website Logo (3D Islamic 8-pointed geometric star) and a World Cup trophy silhouette.
  - Stray particles drift to the edges of the viewport, highlighting the borders of the dashboard UI layout (Navbar, cards).
  - Trigger GSAP timeline to animate the HTML/CSS dashboard cards from bottom to top (Y-axis transition, opacity fade-in, staggered delay).
  - The Canvas transitions to `pointer-events-none` but remains in the background as a slow-moving, ambient floating particle system.

## UI Elements
- Skip Button: Top-right corner, instantly skips all 3D stages, fades out the loading/intro layers, and transitions directly to the final dashboard UI.

## Mobile Rules
- Downgrade: Reduce particle count to 20,000.
- Disabled Effects: Turn off Chromatic Aberration, Vignette, and heavy shockwave refraction filter.
- Shaders: Simplify the carbon-fiber texture calculation.

## Reduced Motion
- Fallback: Instantly skips the 3D Canvas rendering, fading in the admin dashboard panel directly over 500ms.

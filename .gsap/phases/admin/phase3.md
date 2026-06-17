# Phase 3 - 3D WebGL World Cup Intro

## Scope

- Page: Admin Panel
- Section: Admin Intro Overlay
- Recipe Direction: R3F Canvas + Procedural Football Mesh (Matte Carbon panels & custom GLSL neon seams) + GPU particle attraction/repulsion + Hyper-drive Zoom (Z-stretch speed lines) + Supernova Explosion (Shockwave refraction torus) + Reassembly (Islamic star and trophy point clouds) + Edge layouts drift.
- Status: Completed

## Objective

Replace the custom HTML/SVG admin intro with a state-of-the-art interactive 3D WebGL sequence utilizing React Three Fiber, Drei, and custom GPU GLSL shaders.

## Technical Details

### Shaders
1. **Liquid Gold Text Preloader**: Done using HTML5 2D Canvas clip-masking. It runs wavy sin/cos functions and color gradients to simulate rising liquid gold inside the center text.
2. **Football Shader (Vertex/Fragment)**:
   - Vertex: Applies jitter/vibration vertex displacement along face normals during the hyper-drive zoom charge.
   - Fragment: Simulates carbon fiber micro-weave and mathematically maps seams. Blends Gold, Crimson, and Blue neon pulsing glows using time and vertex Y coordinate.
3. **GPU Particle Shader**:
   - Attribute buffers generated for trophy silhouette (tapered cylinder base + top sphere) and website logo (flat XY plane 8-pointed star).
   - Vertex: Computes orbital idle rotations, mouse coordinates attraction/repulsion, velocity speed line stretching, radial explosion damping, and reassembly morphing on the GPU.

### GSAP Timeline
The sequencer controls the cinematic phases by updating simple uniform values (`uStage`, `uReassemblyTime`, `uZoomProgress`, etc.) which are then rendered on the GPU at a locked 60+ FPS.

### Mobile & Accessibility
- Mobile widths automatically downscale particles to 20,000 and disable post-processing.
- Supports prefers-reduced-motion, instantly skipping the canvas to render the dashboard panel directly.

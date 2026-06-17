'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { SkipForward } from 'lucide-react';

interface WorldCup3DIntroProps {
  onComplete: () => void;
  isIntroActive: boolean;
}

// ---------------------------------------------------------------------
// 1. Procedural Football Shaders
// ---------------------------------------------------------------------
const footballVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uDisplacementFactor; // Jitter displacement during hyper-drive charge

  // Pseudo-random noise
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;

    // Displace vertices outward slightly with high-frequency noise for charging vibration
    vec3 displacedPosition = position;
    if (uDisplacementFactor > 0.0) {
      float noiseVal = hash(position + vec3(uTime * 10.0));
      displacedPosition += normal * noiseVal * uDisplacementFactor * 0.12;
    }

    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const footballFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uGlowIntensity;
  uniform vec3 uColor;

  void main() {
    // Spherical coordinates normalization
    vec3 p = normalize(vPosition);

    // 1. Generate Carbon Fiber Micro-Weave
    vec2 weaveUv = vUv * 90.0;
    float wave1 = step(0.5, fract(weaveUv.x));
    float wave2 = step(0.5, fract(weaveUv.y));
    float weave = mix(0.04, 0.12, abs(wave1 - wave2));

    // 2. Generate Football Panel Grid (Checkerboard spherical sin-wave lines)
    float pattern = sin(p.x * 6.5) * sin(p.y * 6.5) * sin(p.z * 6.5);
    float seam = smoothstep(0.0, 0.05, abs(pattern - 0.1));
    float seamMask = 1.0 - seam;

    // 3. Dynamic pulsing glowing seam colors (Gold, Crimson, Blue)
    vec3 gold = vec3(1.0, 0.72, 0.12);
    vec3 crimson = vec3(0.9, 0.04, 0.2);
    vec3 blue = vec3(0.1, 0.45, 0.95);

    // Color cycle based on time and height (Y position)
    float colorCycle = sin(uTime * 2.5 + p.y * 4.0) * 0.5 + 0.5;
    vec3 glowColor = mix(gold, mix(crimson, blue, step(0.5, colorCycle)), colorCycle);
    glowColor *= (1.0 + sin(uTime * 6.0) * 0.25); // neon pulse
    glowColor *= uGlowIntensity;

    // Matte carbon fiber panel color
    vec3 panelColor = vec3(weave);

    // Blend panel surface and glowing seams
    vec3 finalColor = mix(panelColor, glowColor, seamMask * 0.95);

    // Fresnel Rim light
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    finalColor += glowColor * fresnel * 0.45;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ---------------------------------------------------------------------
// 2. GPU Particle Nebula Shaders
// ---------------------------------------------------------------------
const particleVertexShader = `
  attribute vec3 aRandomDir;
  attribute vec3 aTrophyPos;
  attribute vec3 aLogoPos;
  attribute vec4 aRandomVal; // x: type, y: speed, z: seed, w: edge selection

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uStage; // 0: Idle, 1: Zoom/Stretch, 2: Explosion, 3: Reassembly, 4: Edge Layout
  uniform float uExplosionTime;
  uniform float uExplosionDuration;
  uniform float uReassemblyTime;
  uniform float uDriftTime;
  uniform float uMouseInfluence;
  uniform float uZoomProgress;
  uniform float uSpeedLineFactor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 currentPos = position;

    // Stage 0: Idle/Interactive
    if (uStage < 0.5) {
      // Mouse interaction (repelled/attracted dynamically in 3D projection plane)
      vec3 mouse3D = vec3(uMouse * 10.0, 0.0);
      vec3 toMouse = currentPos - mouse3D;
      float dist = length(toMouse);
      if (dist < 4.5) {
        float force = (4.5 - dist) / 4.5;
        // Repel from cursor
        currentPos += normalize(toMouse) * force * 1.2 * uMouseInfluence;
      }

      // Add small continuous orbital rotation based on seed
      float angle = uTime * 0.08 * (1.0 + aRandomVal.y);
      float cosA = cos(angle);
      float sinA = sin(angle);
      float newX = currentPos.x * cosA - currentPos.z * sinA;
      float newZ = currentPos.x * sinA + currentPos.z * cosA;
      currentPos.x = newX;
      currentPos.z = newZ;
    }
    
    // Stage 1: Zoom / Hyper-Drive speed lines
    else if (uStage < 1.5) {
      // Particles stretch forward along Z axis based on zoom progress
      currentPos.z += aRandomVal.z * uZoomProgress * 28.0;
    }
    
    // Stage 2: Supernova Explosion
    else if (uStage < 2.5) {
      // Radial explosion with damping factor
      float t = uExplosionTime;
      currentPos += aRandomDir * (t * 18.0) / (1.0 + t * 2.2);
    }
    
    // Stage 3: Reassembly (Lerping from explosion coordinates to Trophy/Logo)
    else if (uStage < 3.5) {
      // Exploded coordinates
      vec3 explodedPos = position + aRandomDir * (uExplosionDuration * 18.0) / (1.0 + uExplosionDuration * 2.2);
      
      // Target coordinates
      vec3 targetPos = mix(aTrophyPos, aLogoPos, step(0.5, aRandomVal.x));
      
      float t = clamp(uReassemblyTime, 0.0, 1.0);
      t = smoothstep(0.0, 1.0, t); // smooth interpolation
      
      currentPos = mix(explodedPos, targetPos, t);
    }
    
    // Stage 4: Layout Borders & Background Drift
    else {
      vec3 targetPos = mix(aTrophyPos, aLogoPos, step(0.5, aRandomVal.x));
      
      // Map to screen boundary layout borders (Top navbar, sidebar outlines, bottom dashboard outline)
      vec3 edgePos = vec3(0.0);
      if (aRandomVal.w < 0.25) { // Top edge (Navbar)
        edgePos = vec3(aRandomVal.z * 16.0 - 8.0, 5.0, 0.0);
      } else if (aRandomVal.w < 0.50) { // Left edge
        edgePos = vec3(-8.0, aRandomVal.z * 10.0 - 5.0, 0.0);
      } else if (aRandomVal.w < 0.75) { // Right edge
        edgePos = vec3(8.0, aRandomVal.z * 10.0 - 5.0, 0.0);
      } else { // Bottom edge (Cards divider)
        edgePos = vec3(aRandomVal.z * 16.0 - 8.0, -5.0, 0.0);
      }

      // Mix Trophy/Logo and border coordinates (40% of particles form layout boundaries)
      vec3 layoutPos = mix(targetPos, edgePos, step(0.6, aRandomVal.z));
      
      float t = clamp(uDriftTime, 0.0, 1.0);
      t = smoothstep(0.0, 1.0, t);
      
      // Add very subtle floating orbital drift in the background
      vec3 floatDrift = vec3(
        sin(uTime * 0.3 + aRandomVal.x * 20.0) * 0.4,
        cos(uTime * 0.4 + aRandomVal.y * 20.0) * 0.4,
        sin(uTime * 0.25 + aRandomVal.z * 20.0) * 0.3
      );
      
      currentPos = mix(targetPos, layoutPos, t) + floatDrift;
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Color particles Gold
    vColor = vec3(1.0, 0.84, 0.2); // Gold color

    // Size calculation
    float pSize = aRandomVal.y * 0.06 + 0.015;
    if (uStage > 0.5 && uStage < 1.5) {
      // Speed line stretching
      pSize *= (1.0 + uSpeedLineFactor * 6.0);
    }
    
    // Attenuation based on distance to camera
    gl_PointSize = pSize * (350.0 / -mvPosition.z);
    
    // Alpha fade-in
    vAlpha = clamp(1.0 + mvPosition.z * 0.03, 0.1, 1.0);
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  uniform float uOpacity;

  void main() {
    // Generate beautiful soft round glowing particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (dot(coord, coord) > 0.25) discard;
    
    float dist = length(coord);
    float glow = smoothstep(0.5, 0.1, dist);
    
    gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
  }
`;

// ---------------------------------------------------------------------
// 3. Expanding Shockwave Ring Shaders
// ---------------------------------------------------------------------
const shockwaveVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shockwaveFragmentShader = `
  varying vec2 vUv;
  uniform float uGlow;
  uniform vec3 uColor;

  void main() {
    // Create refraction ring pattern
    float dist = length(vUv - vec2(0.5));
    // Narrow circular band
    float ring = smoothstep(0.38, 0.44, dist) * smoothstep(0.48, 0.44, dist);
    
    if (ring < 0.01) discard;
    
    gl_FragColor = vec4(uColor * uGlow * 1.5, ring * uGlow);
  }
`;

// ---------------------------------------------------------------------
// 4. Interactive R3F Scene Engine
// ---------------------------------------------------------------------
interface SceneContentProps {
  stage: number;
  progress: number;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function SceneContent({ stage, progress, timelineRef, onComplete, mouse }: SceneContentProps) {
  const { camera } = useThree();
  const footballRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);

  // Correct Hook Usage: Declare geometry memoization at the top of the component, not in JSX
  const footballGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.8, 3), []);

  // Uniform hooks
  const uniforms = useRef({
    football: {
      uTime: { value: 0 },
      uGlowIntensity: { value: 1.0 },
      uColor: { value: new THREE.Color('#1a1a1a') },
      uDisplacementFactor: { value: 0.0 }
    },
    particles: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uStage: { value: 0.0 },
      uExplosionTime: { value: 0.0 },
      uExplosionDuration: { value: 0.6 },
      uReassemblyTime: { value: 0.0 },
      uDriftTime: { value: 0.0 },
      uMouseInfluence: { value: 1.0 },
      uZoomProgress: { value: 0.0 },
      uSpeedLineFactor: { value: 0.0 },
      uOpacity: { value: 1.0 }
    },
    shockwave: {
      uColor: { value: new THREE.Color('#fbbf24') },
      uGlow: { value: 0.0 }
    }
  });

  // Calculate Particle System Attributes
  const { positions, randomDirs, trophyPositions, logoPositions, randomVals, count } = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const pCount = isMobile ? 20000 : 70000;

    const pos = new Float32Array(pCount * 3);
    const dirs = new Float32Array(pCount * 3);
    const trophy = new Float32Array(pCount * 3);
    const logo = new Float32Array(pCount * 3);
    const rVals = new Float32Array(pCount * 4); // x: type, y: speed, z: seed, w: edge

    for (let i = 0; i < pCount; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // 1. Initial Position (random sphere nebula distribution)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 6.5 + 1.0;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      // 2. Explosion Direction (radial out vector + variance)
      const expTheta = Math.random() * Math.PI * 2;
      const expPhi = Math.acos(Math.random() * 2 - 1);
      const expSpeed = Math.random() * 7.0 + 3.0;
      dirs[i3] = Math.sin(expPhi) * Math.cos(expTheta) * expSpeed;
      dirs[i3 + 1] = Math.sin(expPhi) * Math.sin(expTheta) * expSpeed;
      dirs[i3 + 2] = Math.cos(expPhi) * expSpeed;

      // 3. World Cup Trophy Point Cloud Map
      if (i < pCount * 0.6) {
        // Base and stem (Tapered Cylinder)
        const cyH = Math.random() * 3.6 - 1.8; // height between -1.8 and 1.8
        const cyR = 0.45 + Math.sin((cyH + 1.8) * 0.85) * 0.28;
        const cyAngle = Math.random() * Math.PI * 2;
        trophy[i3] = Math.cos(cyAngle) * cyR;
        trophy[i3 + 1] = cyH;
        trophy[i3 + 2] = Math.sin(cyAngle) * cyR;
      } else {
        // Top globe
        const glR = 1.0;
        const glTheta = Math.random() * Math.PI * 2;
        const glPhi = Math.acos(Math.random() * 2 - 1);
        trophy[i3] = glR * Math.sin(glPhi) * Math.cos(glTheta);
        trophy[i3 + 1] = 2.0 + glR * Math.sin(glPhi) * Math.sin(glTheta); // elevated at Y = 2
        trophy[i3 + 2] = glR * Math.cos(glPhi);
      }

      // 4. Logo Point Cloud Map (8-pointed Islamic geometric star in XY plane)
      const starAngle = Math.random() * Math.PI * 2;
      const numPoints = 8.0;
      const subAngle = Math.PI / numPoints;
      // Geometric math for 8-pointed star edges
      const starRBase = Math.cos(subAngle) / Math.cos(starAngle - subAngle * Math.floor((starAngle + subAngle) / (subAngle * 2.0)));
      const starRadius = (1.2 + Math.random() * 0.3) * starRBase;
      logo[i3] = Math.cos(starAngle) * starRadius;
      logo[i3 + 1] = Math.sin(starAngle) * starRadius;
      logo[i3 + 2] = (Math.random() - 0.5) * 0.15; // flat with slight depth

      // 5. Random Values
      rVals[i4] = Math.random(); // type selector (which target to form)
      rVals[i4 + 1] = Math.random() * 0.8 + 0.2; // orbit/movement speed
      rVals[i4 + 2] = Math.random(); // seed
      rVals[i4 + 3] = Math.random(); // edge layout selector
    }

    return {
      positions: pos,
      randomDirs: dirs,
      trophyPositions: trophy,
      logoPositions: logo,
      randomVals: rVals,
      count: pCount
    };
  }, []);

  // Frame tick animation loop
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    uniforms.current.football.uTime.value = elapsed;
    uniforms.current.particles.uTime.value = elapsed;

    // Mouse Vector interpolation
    uniforms.current.particles.uMouse.value.lerp(
      new THREE.Vector2(mouse.current.x, mouse.current.y),
      0.08
    );

    // Camera parallax on interactive stage
    if (stage === 0) {
      camera.position.x += (mouse.current.x * 1.8 - camera.position.x) * 0.05;
      camera.position.y += (mouse.current.y * 1.8 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Idle Rotation of Football
      if (footballRef.current) {
        footballRef.current.rotation.y = elapsed * 0.18;
        footballRef.current.rotation.x = elapsed * 0.06;
      }
    }
  });

  // Orchestrate Cinematic Timelines on State Changes
  useEffect(() => {
    if (stage === 0) {
      // Reveal stage: Fade in ball scale
      if (footballRef.current) {
        gsap.fromTo(
          footballRef.current.scale,
          { x: 0.001, y: 0.001, z: 0.001 },
          { x: 1, y: 1, z: 1, duration: 1.5, ease: 'elastic.out(1, 0.8)' }
        );
      }
      return;
    }

    // GSAP Cinematic Timelines
    const tl = gsap.timeline();
    timelineRef.current = tl;

    if (stage === 1) {
      // Hyper-Drive Stage
      // Stop football rotation and apply displacement vibrations
      tl.to(uniforms.current.football.uDisplacementFactor, { value: 1.0, duration: 0.4, ease: 'power2.out' })
        .to(uniforms.current.football.uGlowIntensity, { value: 6.5, duration: 0.5, ease: 'power2.in' }, '-=0.4')
        // Camera pulling back slightly
        .to(camera.position, { z: 9.0, duration: 0.4, ease: 'power1.out' }, '-=0.4')
        // Rapid Zoom-in forward
        .to(
          uniforms.current.particles.uStage,
          {
            value: 1.0,
            duration: 0.1,
            onStart: () => {
              // Toggle stage variable to let shader handle zoom coordinates
              uniforms.current.particles.uStage.value = 1.0;
            }
          },
          '+=0.1'
        )
        .to(uniforms.current.particles.uZoomProgress, { value: 1.0, duration: 0.8, ease: 'power4.in' }, '-=0.1')
        .to(uniforms.current.particles.uSpeedLineFactor, { value: 1.0, duration: 0.8, ease: 'power4.in' }, '-=0.8')
        .to(camera.position, { z: -1.2, duration: 0.8, ease: 'power4.in' }, '-=0.8');
    } 
    
    else if (stage === 2) {
      // Supernova Explosion Stage
      // Instantly hide the football
      if (footballRef.current) {
        footballRef.current.visible = false;
      }

      // Configure particles stage and trigger shockwave ring scale
      uniforms.current.particles.uStage.value = 2.0;

      if (shockwaveRef.current) {
        shockwaveRef.current.scale.set(0.01, 0.01, 0.01);
        shockwaveRef.current.visible = true;
      }

      // Explosion trigger
      tl.to(uniforms.current.particles.uExplosionTime, { value: 0.6, duration: 0.6, ease: 'power3.out' })
        .to(uniforms.current.shockwave.uGlow, { value: 1.0, duration: 0.2 }, '-=0.6')
        .to(shockwaveRef.current!.scale, { x: 5.5, y: 5.5, z: 5.5, duration: 0.6, ease: 'power2.out' }, '-=0.6')
        .to(uniforms.current.shockwave.uGlow, { value: 0.0, duration: 0.4 }, '-=0.4');
    } 
    
    else if (stage === 3) {
      // Vortex Reassembly & UI Layout Edge Drift
      // Turn off shockwave visibility
      if (shockwaveRef.current) {
        shockwaveRef.current.visible = false;
      }

      // Transition camera back to normal position
      tl.to(camera.position, { x: 0, y: 0, z: 7.0, duration: 1.2, ease: 'power2.out' })
        // Lerp particles to reassemble silhouette
        .to(
          uniforms.current.particles.uStage,
          {
            value: 3.0,
            duration: 0.1,
            onStart: () => {
              uniforms.current.particles.uStage.value = 3.0;
            }
          },
          '-=1.2'
        )
        .to(uniforms.current.particles.uReassemblyTime, { value: 1.0, duration: 2.2, ease: 'power3.inOut' }, '-=1.1')
        
        // Stage 4: Layout Edge Drift & Ambient floating background
        .to(
          uniforms.current.particles.uStage,
          {
            value: 4.0,
            duration: 0.1,
            onStart: () => {
              uniforms.current.particles.uStage.value = 4.0;
            }
          },
          '+=0.2'
        )
        .to(uniforms.current.particles.uDriftTime, { value: 1.0, duration: 1.8, ease: 'power2.inOut' }, '-=0.1')
        .to(
          {},
          {
            duration: 0.2,
            onComplete: () => {
              onComplete();
            }
          }
        );
    }

    return () => {
      tl.kill();
    };
  }, [stage]);

  return (
    <>
      {/* 3D Football Mesh */}
      <mesh ref={footballRef} geometry={footballGeometry}>
        <shaderMaterial
          vertexShader={footballVertexShader}
          fragmentShader={footballFragmentShader}
          uniforms={uniforms.current.football}
          transparent={false}
          depthWrite={true}
        />
      </mesh>

      {/* GPU Particle Nebula System */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aRandomDir"
            args={[randomDirs, 3]}
          />
          <bufferAttribute
            attach="attributes-aTrophyPos"
            args={[trophyPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-aLogoPos"
            args={[logoPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-aRandomVal"
            args={[randomVals, 4]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={uniforms.current.particles}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 3D Shockwave Ring */}
      <mesh ref={shockwaveRef} visible={false} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.05, 1.8, 64]} />
        <shaderMaterial
          vertexShader={shockwaveVertexShader}
          fragmentShader={shockwaveFragmentShader}
          uniforms={uniforms.current.shockwave}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------
// 5. Main Component Wrapper
// ---------------------------------------------------------------------
export default function WorldCup3DIntro({ onComplete, isIntroActive }: WorldCup3DIntroProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cinematicStage, setCinematicStage] = useState(0); // 0: Idle/Reveal, 1: Hyper-Drive Zoom, 2: Supernova, 3: Reassembly, 4: Complete

  const mouseRef = useRef({ x: 0, y: 0 });

  // 1. Loading Text Screen Simulator
  useEffect(() => {
    if (!isIntroActive) return;

    let currentProgress = 0;
    let time = 0;
    let canvasAnimFrame: number;
    const width = 400;
    const height = 150;

    // 2D Liquid Gold text rendering loop
    const renderLoadingText = () => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) {
        canvasAnimFrame = requestAnimationFrame(renderLoadingText);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        canvasAnimFrame = requestAnimationFrame(renderLoadingText);
        return;
      }

      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      time += 0.02;

      ctx.clearRect(0, 0, width, height);

      // Draw background text
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.font = '900 68px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOADING', width / 2, height / 2);

      // Draw liquid mask
      ctx.save();
      ctx.beginPath();
      // Wave level mapped to progress percentage
      const waveHeight = height - (currentProgress / 100) * height;
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 8) {
        const y = waveHeight + Math.sin(x * 0.04 + time * 4.5) * 5.0;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.clip();

      // Draw shiny golden gradient text
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#fff6c2');
      grad.addColorStop(0.3, '#fbbf24');
      grad.addColorStop(0.7, '#d97706');
      grad.addColorStop(1, '#5a2300');
      ctx.fillStyle = grad;
      ctx.fillText('LOADING', width / 2, height / 2);

      // Draw shiny light sweep
      const sweepX = (time * 180) % (width * 2) - width;
      const sweepGrad = ctx.createLinearGradient(sweepX, 0, sweepX + 100, 0);
      sweepGrad.addColorStop(0, 'rgba(251,191,36,0)');
      sweepGrad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
      sweepGrad.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillText('LOADING', width / 2, height / 2);

      ctx.restore();
      canvasAnimFrame = requestAnimationFrame(renderLoadingText);
    };

    renderLoadingText();

    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Loading complete animation
        gsap.to('#preloader-overlay', {
          opacity: 0,
          scale: 0.95,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            setIsLoaded(true);
            triggerHyperDriveTimeout();
          }
        });
      }
      setLoadingProgress(currentProgress);
    }, 180);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(canvasAnimFrame);
    };
  }, [isIntroActive]);

  // Track mouse coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 4s timeout before automatic hyper-drive trigger
  const triggerHyperDriveTimeout = () => {
    timeoutRef.current = setTimeout(() => {
      triggerHyperDrive();
    }, 4500);
  };

  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (isIntroActive) {
      setHasBeenActive(true);
    }
  }, [isIntroActive]);

  // Skip the intro sequence entirely
  const handleSkip = () => {
    if (activeTimeline.current) {
      activeTimeline.current.kill();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCinematicStage(4);
    setIsLoaded(true);
    onComplete();
  };

  // Trigger Hyper-Drive Zoom and Explosion cinematic sequence
  const triggerHyperDrive = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (cinematicStage !== 0) return;

    setCinematicStage(1); // Start zoom

    // Schedule subsequent cinematic phases in milliseconds
    // Zoom stage takes 0.9s
    setTimeout(() => {
      setCinematicStage(2); // Supernova explosion

      // Explosion takes 0.6s
      setTimeout(() => {
        setCinematicStage(3); // Vortex / Reassembly
      }, 650);

    }, 950);
  };

  // Final Stage Fade out
  const handleIntroTimelineFinished = () => {
    setCinematicStage(4);
    onComplete();
  };

  // Prefers Reduced Motion check
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion && isIntroActive) {
      onComplete();
    }
  }, [prefersReducedMotion, isIntroActive, onComplete]);

  if (prefersReducedMotion) return null;

  if (!isIntroActive && !hasBeenActive) return null;

  const isBackgroundMode = cinematicStage === 4 || !isIntroActive;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full flex items-center justify-center font-sans overflow-hidden transition-all duration-1000 ${
        isBackgroundMode
          ? 'z-[0] pointer-events-none bg-transparent'
          : 'z-[1000] pointer-events-auto bg-[#03050a]'
      }`}
    >
      {/* 3D R3F Canvas target */}
      {isLoaded && (
        <div 
          onClick={triggerHyperDrive}
          className="absolute inset-0 w-full h-full z-10 cursor-pointer"
          title="Click to hyper-drive zoom! ⚡"
        >
          <Canvas
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0, 7.5], fov: 60 }}
            dpr={[1, Math.min(window.devicePixelRatio, 2)]}
          >
            <ambientLight intensity={0.4} />
            <pointLight position={[6, 6, 6]} intensity={1.5} color="#fbbf24" />
            <directionalLight position={[-5, 5, 2]} intensity={1.0} />
            
            <SceneContent
              stage={cinematicStage}
              progress={loadingProgress}
              timelineRef={activeTimeline}
              mouse={mouseRef}
              onComplete={handleIntroTimelineFinished}
            />
          </Canvas>
        </div>
      )}

      {/* Custom CSS/Canvas preloader overlay */}
      {!isLoaded && (
        <div
          id="preloader-overlay"
          className="relative z-20 flex flex-col items-center justify-center text-center p-6"
        >
          {/* Custom WebGL/2D shader simulated canvas for liquid gold fill */}
          <canvas ref={overlayCanvasRef} className="max-w-full drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]" />
          
          <div className="text-amber-500 font-mono text-sm tracking-widest uppercase mt-4 font-bold">
            {loadingProgress}%
          </div>
          
          <div className="w-56 bg-white/5 h-[3px] rounded-full overflow-hidden mt-4 border border-white/[0.03] relative">
            <div
              className="bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 h-full transition-all duration-150 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-2">
            World Cup Portal Initializing...
          </div>
        </div>
      )}

      {/* Screen velocity overlay effects (Vignette & Chromatic Aberration) during Zoom */}
      {cinematicStage === 1 && (
        <div className="absolute inset-0 z-15 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)] animate-pulse" />
      )}

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-8 z-30 px-5 py-2.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:bg-black/70 hover:border-[#fbbf24] hover:text-[#fbbf24] transition duration-300 text-xs font-black text-white/80 flex items-center gap-2 shadow-2xl"
      >
        <SkipForward className="w-3.5 h-3.5" />
        Skip Intro ⚡
      </button>
    </div>
  );
}

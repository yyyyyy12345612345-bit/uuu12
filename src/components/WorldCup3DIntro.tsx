'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { SkipForward } from 'lucide-react';
import { audioSynth } from '@/lib/WorldCupAudioSynth';

interface WorldCup3DIntroProps {
  onComplete: () => void;
  isIntroActive: boolean;
}

// ---------------------------------------------------------------------
// 1. Procedural Pitch Marks Texture Generator
// ---------------------------------------------------------------------
function createPitchTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Turf base
  ctx.fillStyle = '#15803d'; // deep grass green
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Mowed stripes
  ctx.fillStyle = '#166534';
  const stripeWidth = 64;
  for (let x = 0; x < canvas.width; x += stripeWidth) {
    if ((x / stripeWidth) % 2 === 0) {
      ctx.fillRect(x, 0, stripeWidth, canvas.height);
    }
  }

  // Draw white markers
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 5;

  // Pitch boundary border
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Half-way line
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 20);
  ctx.lineTo(canvas.width / 2, canvas.height - 20);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 85, 0, Math.PI * 2);
  ctx.stroke();

  // Kickoff dot
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Penalty areas (Left / Right)
  // Left Box
  ctx.strokeRect(20, canvas.height / 2 - 120, 160, 240);
  ctx.strokeRect(20, canvas.height / 2 - 60, 50, 120);
  // Right Box
  ctx.strokeRect(canvas.width - 180, canvas.height / 2 - 120, 160, 240);
  ctx.strokeRect(canvas.width - 70, canvas.height / 2 - 60, 50, 120);

  // Penalty spots
  ctx.beginPath();
  ctx.arc(130, canvas.height / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width - 130, canvas.height / 2, 6, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ---------------------------------------------------------------------
// 2. Custom Neon Football Shaders
// ---------------------------------------------------------------------
const footballVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uDisplacementFactor;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;

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

  void main() {
    vec3 p = normalize(vPosition);

    // Carbon fiber panel texture
    vec2 weaveUv = vUv * 90.0;
    float wave1 = step(0.5, fract(weaveUv.x));
    float wave2 = step(0.5, fract(weaveUv.y));
    float weave = mix(0.04, 0.12, abs(wave1 - wave2));

    // Panel grid seams
    float pattern = sin(p.x * 6.5) * sin(p.y * 6.5) * sin(p.z * 6.5);
    float seam = smoothstep(0.0, 0.05, abs(pattern - 0.1));
    float seamMask = 1.0 - seam;

    // Glowing seam cycle colors
    vec3 gold = vec3(1.0, 0.75, 0.15);
    vec3 crimson = vec3(0.95, 0.05, 0.22);
    vec3 blue = vec3(0.12, 0.5, 0.98);

    float colorCycle = sin(uTime * 2.8 + p.y * 3.5) * 0.5 + 0.5;
    vec3 glowColor = mix(gold, mix(crimson, blue, step(0.5, colorCycle)), colorCycle);
    glowColor *= (1.0 + sin(uTime * 5.0) * 0.3); // pulse neon
    glowColor *= uGlowIntensity;

    vec3 panelColor = vec3(weave);
    vec3 finalColor = mix(panelColor, glowColor, seamMask * 0.95);

    // Fresnel Rim light
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    finalColor += glowColor * fresnel * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ---------------------------------------------------------------------
// 3. Cheering Crowd Shaders
// ---------------------------------------------------------------------
const crowdVertexShader = `
  attribute vec3 aRandoms; // x: speed, y: phase offset, z: seed
  uniform float uTime;
  varying vec3 vColor;
  varying float vFlash;

  void main() {
    vColor = color;
    vec3 pos = position;

    // Flag wave/cheering oscillation
    pos.y += sin(uTime * 4.0 * aRandoms.x + aRandoms.y) * 0.15;
    pos.x += cos(uTime * 2.5 * aRandoms.x + aRandoms.y) * 0.08;

    // Camera light flashes
    vFlash = sin(uTime * 12.0 * aRandoms.z + aRandoms.y) * 0.5 + 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    gl_PointSize = (4.0 + aRandoms.z * 5.0) * (300.0 / -mvPosition.z);
  }
`;

const crowdFragmentShader = `
  varying vec3 vColor;
  varying float vFlash;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (dot(coord, coord) > 0.25) discard;

    vec3 finalColor = vColor;
    if (vColor.r > 1.2) {
      // Flashing phone lights
      finalColor *= (0.3 + vFlash * 1.7);
    } else {
      // Regular waving fans
      finalColor *= (0.75 + vFlash * 0.25);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ---------------------------------------------------------------------
// 4. Fireworks Sparks Shaders
// ---------------------------------------------------------------------
const fireworksVertexShader = `
  attribute vec3 aVelocity;
  attribute vec3 aData; // x: delay, y: lifetime, z: initial size
  uniform float uTime;
  varying vec3 vColor;
  varying float vFade;

  void main() {
    vColor = color;
    vec3 pos = position;

    float t = uTime - aData.x;
    if (t < 0.0) {
      vFade = 0.0;
      gl_Position = vec4(-9999.0, -9999.0, 0.0, 1.0);
      return;
    }

    float progress = t / aData.y;
    if (progress > 1.0) {
      vFade = 0.0;
      gl_Position = vec4(-9999.0, -9999.0, 0.0, 1.0);
      return;
    }

    // Motion with physics (air drag + gravity)
    pos += aVelocity * t;
    pos.y -= 4.9 * t * t; // gravity drop

    vFade = 1.0 - progress; // Linear fade

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    gl_PointSize = aData.z * vFade * (250.0 / -mvPosition.z);
  }
`;

const fireworksFragmentShader = `
  varying vec3 vColor;
  varying float vFade;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (dot(coord, coord) > 0.25) discard;

    float glow = smoothstep(0.5, 0.0, length(coord));
    gl_FragColor = vec4(vColor, glow * vFade);
  }
`;

// ---------------------------------------------------------------------
// 5. GPU Reassembly Particle Shaders (Website Logo / Trophy point cloud)
// ---------------------------------------------------------------------
const particleVertexShader = `
  attribute vec3 aRandomDir;
  attribute vec3 aTrophyPos;
  attribute vec3 aLogoPos;
  attribute vec4 aRandomVal; // x: target ratio, y: speed, z: seed, w: edge divider

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uStage; // 0-2: Stadium Orbit, 3: Kickoff Zoom, 4: Reassembly, 5: UI Outline
  uniform float uReassemblyTime;
  uniform float uZoomProgress;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 currentPos = position;

    // Stage 0-2: Orbital drifting particles
    if (uStage < 2.5) {
      float angle = uTime * 0.12 * (1.0 + aRandomVal.y);
      float cosA = cos(angle);
      float sinA = sin(angle);
      float newX = currentPos.x * cosA - currentPos.z * sinA;
      float newZ = currentPos.x * sinA + currentPos.z * cosA;
      currentPos.x = newX;
      currentPos.z = newZ;
      currentPos.y += sin(uTime * 0.5 + aRandomVal.y * 10.0) * 0.3;
    }
    // Stage 3: Speed lines zoom
    else if (uStage < 3.5) {
      currentPos.z += aRandomVal.z * uZoomProgress * 30.0;
    }
    // Stage 4: Reassembly into Star Logo or Trophy silhouette
    else if (uStage < 4.5) {
      vec3 targetPos = mix(aTrophyPos, aLogoPos, step(0.5, aRandomVal.x));
      // Interpolate from drift position to target reassembly coordinate
      currentPos = mix(currentPos, targetPos, clamp(uReassemblyTime, 0.0, 1.0));
    }
    // Stage 5: Draw UI Layout boundaries
    else {
      vec3 targetPos = mix(aTrophyPos, aLogoPos, step(0.5, aRandomVal.x));
      
      vec3 edgePos = vec3(0.0);
      if (aRandomVal.w < 0.25) { // Top nav outline
        edgePos = vec3(aRandomVal.z * 16.0 - 8.0, 4.5, 0.0);
      } else if (aRandomVal.w < 0.50) { // Left sidebar outline
        edgePos = vec3(-8.2, aRandomVal.z * 10.0 - 5.0, 0.0);
      } else if (aRandomVal.w < 0.75) { // Right outline
        edgePos = vec3(8.2, aRandomVal.z * 10.0 - 5.0, 0.0);
      } else { // Cards divider
        edgePos = vec3(aRandomVal.z * 16.0 - 8.0, -4.5, 0.0);
      }

      vec3 boundaryPos = mix(targetPos, edgePos, step(0.55, aRandomVal.z));
      currentPos = boundaryPos + vec3(
        sin(uTime * 0.2 + aRandomVal.x * 10.0) * 0.15,
        cos(uTime * 0.3 + aRandomVal.y * 10.0) * 0.15,
        0.0
      );
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vColor = vec3(0.98, 0.78, 0.15); // Rich Golden Spark
    float pSize = aRandomVal.y * 0.065 + 0.015;
    gl_PointSize = pSize * (350.0 / -mvPosition.z);
    vAlpha = clamp(1.0 + mvPosition.z * 0.02, 0.15, 1.0);
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (dot(coord, coord) > 0.25) discard;
    float glow = smoothstep(0.5, 0.1, length(coord));
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

// ---------------------------------------------------------------------
// 6. 3D Stadium stands and goals
// ---------------------------------------------------------------------
function StadiumStands() {
  // Nested cylinder rings flaring out representing stands tiers
  const stands = useMemo(() => {
    const group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const radiusInner = 14.0 + i * 2.6;
      const radiusOuter = 16.2 + i * 2.6;
      const height = 0.5 + i * 1.5;
      const cylinder = new THREE.CylinderGeometry(radiusOuter, radiusInner, 1.2, 32, 1, true);
      cylinder.translate(0, height, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: '#0a0f1d',
        roughness: 0.85,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      group.add(new THREE.Mesh(cylinder, mat));
    }
    return group;
  }, []);

  return <primitive object={stands} />;
}

function GoalPosts() {
  const postMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), []);
  const netMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.12 }), []);

  return (
    <group>
      {/* Left goal (X = -10.5) */}
      <group position={[-10.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.0, -1.8]} material={postMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 2.0, 8]} />
        </mesh>
        <mesh position={[0, 1.0, 1.8]} material={postMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 2.0, 8]} />
        </mesh>
        <mesh position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={postMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 3.6, 8]} />
        </mesh>
        <mesh position={[-0.6, 1.0, 0]} material={netMaterial}>
          <boxGeometry args={[1.2, 2.0, 3.6]} />
        </mesh>
      </group>

      {/* Right goal (X = 10.5) */}
      <group position={[10.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 1.0, -1.8]} material={postMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 2.0, 8]} />
        </mesh>
        <mesh position={[0, 1.0, 1.8]} material={postMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 2.0, 8]} />
        </mesh>
        <mesh position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={postMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 3.6, 8]} />
        </mesh>
        <mesh position={[-0.6, 1.0, 0]} material={netMaterial}>
          <boxGeometry args={[1.2, 2.0, 3.6]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------
// 7. Stylized Low-Poly Player
// ---------------------------------------------------------------------
interface PlayerProps {
  position: [number, number, number];
  isKicker?: boolean;
  runningOffset?: number;
  kickProgress?: number;
  rotationY?: number;
}

function PlayerModel({ position, isKicker, runningOffset = 0, kickProgress = 0, rotationY = 0 }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);

  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: isKicker ? '#e11d48' : '#2563eb', roughness: 0.5 }), [isKicker]);
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbcfe8', roughness: 0.6 }), []);
  const shortsMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 }), []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (!isKicker || kickProgress === 0) {
      // running leg swing loop
      const runSpeed = 11.0;
      const t = elapsed * runSpeed + runningOffset;
      const swingAngle = Math.sin(t) * 0.75;

      if (leftLegRef.current) leftLegRef.current.rotation.x = swingAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swingAngle;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swingAngle * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swingAngle * 0.8;

      if (torsoRef.current) {
        torsoRef.current.position.y = 1.35 + Math.abs(Math.sin(t * 2.0)) * 0.08;
      }
    } else {
      // Kick impact flip interpolation (kProgress 0 -> 1)
      const p = kickProgress;
      if (groupRef.current) {
        groupRef.current.position.y = position[1] + Math.sin(p * Math.PI) * 2.4;
        groupRef.current.rotation.x = -p * Math.PI * 1.5; // bicycle backflip
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -Math.sin(p * Math.PI) * 2.0; // kicking kick forward
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(p * Math.PI) * 0.8;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 1.35, 0]} material={shirtMat}>
        <cylinderGeometry args={[0.22, 0.18, 0.7, 8]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.85, 0]} material={skinMat}>
        <sphereGeometry args={[0.16, 8, 8]} />
      </mesh>
      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.12, 1.0, 0]}>
        <mesh position={[0, -0.35, 0]} material={shortsMat}>
          <cylinderGeometry args={[0.08, 0.06, 0.7, 8]} />
        </mesh>
      </group>
      {/* Right leg */}
      <group ref={rightLegRef} position={[0.12, 1.0, 0]}>
        <mesh position={[0, -0.35, 0]} material={shortsMat}>
          <cylinderGeometry args={[0.08, 0.06, 0.7, 8]} />
        </mesh>
      </group>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.26, 1.6, 0]}>
        <mesh position={[0, -0.25, 0]} material={shirtMat}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
        </mesh>
      </group>
      {/* Right arm */}
      <group ref={rightArmRef} position={[0.26, 1.6, 0]}>
        <mesh position={[0, -0.25, 0]} material={shirtMat}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------
// 8. World Cup Lathe Trophy
// ---------------------------------------------------------------------
interface TrophyProps {
  position: [number, number, number];
  riseProgress: number;
}

function WorldCupTrophy({ position, riseProgress }: TrophyProps) {
  const trophyRef = useRef<THREE.Group>(null);

  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d97706',
    metalness: 0.9,
    roughness: 0.15,
    emissive: '#78350f',
    emissiveIntensity: 0.2
  }), []);

  const greenMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#047857',
    metalness: 0.6,
    roughness: 0.35
  }), []);

  useEffect(() => {
    if (trophyRef.current) {
      trophyRef.current.position.y = -3.8 + riseProgress * 3.8;
    }
  }, [riseProgress]);

  return (
    <group ref={trophyRef} position={position}>
      {/* base */}
      <mesh position={[0, 0.15, 0]} material={goldMat}>
        <cylinderGeometry args={[0.6, 0.7, 0.3, 16]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={greenMat}>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={goldMat}>
        <cylinderGeometry args={[0.5, 0.55, 0.2, 16]} />
      </mesh>
      <mesh position={[0, 0.65, 0]} material={greenMat}>
        <cylinderGeometry args={[0.48, 0.48, 0.1, 16]} />
      </mesh>
      {/* stem */}
      <mesh position={[0, 1.25, 0]} material={goldMat}>
        <cylinderGeometry args={[0.3, 0.45, 1.0, 16]} />
      </mesh>
      {/* cup support */}
      <mesh position={[0, 1.8, 0]} material={goldMat}>
        <cylinderGeometry args={[0.55, 0.28, 0.3, 16]} />
      </mesh>
      {/* top sphere globe */}
      <mesh position={[0, 2.3, 0]} material={goldMat}>
        <sphereGeometry args={[0.5, 16, 16]} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <sphereGeometry args={[0.52, 16, 16]} />
        <meshBasicMaterial color="#fef08a" wireframe transparent opacity={0.35} />
      </mesh>
      {/* aura band */}
      <mesh position={[0, 1.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.75, 32]} />
        <meshBasicMaterial color="#047857" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// 9. Interactive Scene Content Coordinator
// ---------------------------------------------------------------------
interface SceneContentProps {
  stage: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  kickProgress: number;
  trophyRise: number;
  ballZoom: number;
  fireworksActive: boolean;
  shockwaveScale: number;
  shockwaveGlow: number;
  particlesReassembly: number;
}

function SceneContent({
  stage,
  mouse,
  kickProgress,
  trophyRise,
  ballZoom,
  fireworksActive,
  shockwaveScale,
  shockwaveGlow,
  particlesReassembly
}: SceneContentProps) {
  const { camera } = useThree();
  const footballRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const fireworksRef = useRef<THREE.Points>(null);

  const spotlight1Ref = useRef<THREE.SpotLight>(null);
  const spotlight2Ref = useRef<THREE.SpotLight>(null);
  const spotlight3Ref = useRef<THREE.SpotLight>(null);
  const spotlight4Ref = useRef<THREE.SpotLight>(null);

  const footballGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.6, 3), []);

  const uniforms = useRef({
    football: {
      uTime: { value: 0 },
      uGlowIntensity: { value: 1.2 },
      uDisplacementFactor: { value: 0.0 }
    },
    crowd: {
      uTime: { value: 0 }
    },
    fireworks: {
      uTime: { value: 0.0 }
    },
    particles: {
      uTime: { value: 0.0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uStage: { value: 0.0 },
      uReassemblyTime: { value: 0.0 },
      uZoomProgress: { value: 0.0 }
    },
    shockwave: {
      uColor: { value: new THREE.Color('#fbbf24') },
      uGlow: { value: 0.0 }
    }
  });

  // Calculate Crowd System Coordinates
  const { crowdPositions, crowdColors, crowdRandoms } = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 2500 : 7000;

    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const tier = Math.floor(Math.random() * 4);
      const radius = 14.5 + tier * 2.6 + Math.random() * 1.5;
      const height = 0.8 + tier * 1.5 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius * 0.76; // Squeezed oval rings

      // Color tags: Gold, Crimson, Blue, White (Phone flashes)
      const rVal = Math.random();
      let colorVal = new THREE.Color('#fbbf24');
      if (rVal < 0.25) colorVal.set('#fbbf24');
      else if (rVal < 0.50) colorVal.set('#f43f5e');
      else if (rVal < 0.75) colorVal.set('#3b82f6');
      else colorVal.set(1.7, 1.7, 1.7); // Bright white flashes

      col[i * 3] = colorVal.r;
      col[i * 3 + 1] = colorVal.g;
      col[i * 3 + 2] = colorVal.b;

      rnd[i * 3] = Math.random(); // speed
      rnd[i * 3 + 1] = Math.random() * Math.PI * 2; // phase offset
      rnd[i * 3 + 2] = Math.random(); // seed
    }

    return { crowdPositions: pos, crowdColors: col, crowdRandoms: rnd };
  }, []);

  // Calculate Fireworks Coordinates
  const { fireworksPos, fireworksVel, fireworksCol, fireworksData } = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 1200 : 3500;

    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const dat = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spawn low on pitch or high in sky
      const isSky = Math.random() < 0.55;
      pos[i * 3] = 0;
      pos[i * 3 + 1] = isSky ? 6.0 + Math.random() * 4.0 : 0.2;
      pos[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2.0 - 1.0);
      const speed = isSky ? 4.0 + Math.random() * 8.0 : 7.0 + Math.random() * 12.0;

      vel[i * 3] = Math.sin(phi) * Math.cos(angle) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(angle) * speed + (isSky ? 2.0 : 5.0);
      vel[i * 3 + 2] = Math.cos(phi) * speed;

      const colorVal = new THREE.Color();
      const rand = Math.random();
      if (rand < 0.25) colorVal.set('#fbbf24');
      else if (rand < 0.5) colorVal.set('#f43f5e');
      else if (rand < 0.75) colorVal.set('#10b981');
      else colorVal.set('#ec4899');

      col[i * 3] = colorVal.r;
      col[i * 3 + 1] = colorVal.g;
      col[i * 3 + 2] = colorVal.b;

      dat[i * 3] = Math.random() * 0.8; // delay
      dat[i * 3 + 1] = 1.0 + Math.random() * 1.5; // life
      dat[i * 3 + 2] = 4.0 + Math.random() * 5.0; // size
    }

    return { fireworksPos: pos, fireworksVel: vel, fireworksCol: col, fireworksData: dat };
  }, []);

  // Calculate GPU Reassembly System Coordinates
  const { positions, randomDirs, trophyPositions, logoPositions, randomVals } = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 15000 : 50000;

    const pos = new Float32Array(count * 3);
    const dirs = new Float32Array(count * 3);
    const trophy = new Float32Array(count * 3);
    const logo = new Float32Array(count * 3);
    const rVals = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // Orbit Initial Position
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 6.0 + 1.2;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      // Random Velocity
      dirs[i3] = (Math.random() - 0.5) * 8.0;
      dirs[i3 + 1] = (Math.random() - 0.5) * 8.0;
      dirs[i3 + 2] = (Math.random() - 0.5) * 8.0;

      // Trophy point map
      if (i < count * 0.6) {
        // stem cylinder
        const h = Math.random() * 3.0 - 1.5;
        const cyR = 0.4 + Math.sin((h + 1.5) * 0.9) * 0.25;
        const a = Math.random() * Math.PI * 2;
        trophy[i3] = Math.cos(a) * cyR;
        trophy[i3 + 1] = h + 1.5;
        trophy[i3 + 2] = Math.sin(a) * cyR;
      } else {
        // top globe
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(Math.random() * 2 - 1);
        const rGlob = 0.8;
        trophy[i3] = rGlob * Math.sin(ph) * Math.cos(th);
        trophy[i3 + 1] = 2.4 + rGlob * Math.sin(ph) * Math.sin(th);
        trophy[i3 + 2] = rGlob * Math.cos(ph);
      }

      // Islamic 8-pointed star star map
      const starAngle = Math.random() * Math.PI * 2;
      const numPoints = 8.0;
      const subAngle = Math.PI / numPoints;
      const starRBase = Math.cos(subAngle) / Math.cos(starAngle - subAngle * Math.floor((starAngle + subAngle) / (subAngle * 2.0)));
      const starRadius = (1.1 + Math.random() * 0.25) * starRBase;
      logo[i3] = Math.cos(starAngle) * starRadius;
      logo[i3 + 1] = Math.sin(starAngle) * starRadius + 1.2;
      logo[i3 + 2] = (Math.random() - 0.5) * 0.12;

      // Random metadata values
      rVals[i4] = Math.random();
      rVals[i4 + 1] = Math.random() * 0.8 + 0.2;
      rVals[i4 + 2] = Math.random();
      rVals[i4 + 3] = Math.random();
    }

    return { positions: pos, randomDirs: dirs, trophyPositions: trophy, logoPositions: logo, randomVals: rVals };
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    uniforms.current.football.uTime.value = elapsed;
    uniforms.current.crowd.uTime.value = elapsed;
    uniforms.current.particles.uTime.value = elapsed;

    if (fireworksActive) {
      uniforms.current.fireworks.uTime.value += state.clock.getDelta();
    }

    // Update uniform stages
    uniforms.current.particles.uStage.value = stage;
    uniforms.current.particles.uReassemblyTime.value = particlesReassembly;
    uniforms.current.particles.uZoomProgress.value = ballZoom;

    // Spotlight mouse tracking targets
    if (stage === 2) {
      const targetX = mouse.current.x * 6.5;
      const targetZ = mouse.current.y * 4.5;
      if (spotlight1Ref.current) spotlight1Ref.current.target.position.set(targetX, 0, targetZ);
      if (spotlight2Ref.current) spotlight2Ref.current.target.position.set(-targetX, 0, -targetZ);
      if (spotlight3Ref.current) spotlight3Ref.current.target.position.set(-targetX, 0, targetZ);
      if (spotlight4Ref.current) spotlight4Ref.current.target.position.set(targetX, 0, -targetZ);

      spotlight1Ref.current?.target.updateMatrixWorld();
      spotlight2Ref.current?.target.updateMatrixWorld();
      spotlight3Ref.current?.target.updateMatrixWorld();
      spotlight4Ref.current?.target.updateMatrixWorld();
    }

    // Phase Camera Movement Controls
    if (stage === 1) {
      // Slow 360-sweep
      const sweepAngle = elapsed * 0.38;
      camera.position.x = Math.sin(sweepAngle) * 13.5;
      camera.position.z = Math.cos(sweepAngle) * 13.5;
      camera.position.y = 5.0 + Math.sin(elapsed * 0.6) * 1.4;
      camera.lookAt(0, 1.2, 0);
    } 
    else if (stage === 2) {
      // Close hover look
      camera.position.x += (mouse.current.x * 2.2 - camera.position.x) * 0.05;
      camera.position.y += (2.2 + mouse.current.y * 0.8 - camera.position.y) * 0.05;
      camera.position.z += (4.6 - camera.position.z) * 0.05;
      camera.lookAt(0, 1.5, 0);
    } 
    else if (stage === 3) {
      // Locked camera perspective for Kick
      camera.position.set(0, 2.3, 4.4);
      camera.lookAt(0, 1.6, 0);
    } 
    else if (stage >= 4) {
      // Pull back ambient drift
      camera.position.x += (Math.sin(elapsed * 0.25) * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (2.8 + Math.cos(elapsed * 0.2) * 0.6 - camera.position.y) * 0.03;
      camera.position.z += (8.2 - camera.position.z) * 0.03;
      camera.lookAt(0, 1.4, 0);
    }

    // Animate Football mesh coordinates
    if (footballRef.current) {
      if (stage === 1) {
        // Slow idle float
        footballRef.current.position.set(0, 1.6 + Math.sin(elapsed * 2.0) * 0.15, 0);
        footballRef.current.rotation.y = elapsed * 0.35;
      } 
      else if (stage === 2) {
        // Hovering right above the trophy
        footballRef.current.position.set(0, 2.3 + Math.sin(elapsed * 2.5) * 0.08, 0);
        footballRef.current.rotation.y = elapsed * 0.45;
      } 
      else if (stage === 3) {
        // Kicked and flying towards the camera
        // Start at [0, 2.2, 0] (kicker foot) and zoom past camera [0, 2.5, 8.5]
        const zPos = ballZoom * 8.5;
        const yPos = 2.2 - Math.sin(ballZoom * Math.PI) * 0.3 + ballZoom * 0.3;
        footballRef.current.position.set(0, yPos, zPos);
        footballRef.current.rotation.x = elapsed * 24.0; // Rapid spin
        footballRef.current.rotation.y = elapsed * 8.0;
        
        // Vibrate ball before strike
        if (ballZoom < 0.05) {
          uniforms.current.football.uDisplacementFactor.value = 1.2;
        } else {
          uniforms.current.football.uDisplacementFactor.value = 0.0;
        }
      } 
      else {
        // Ball exploded, hide
        footballRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* 3D Football Mesh */}
      <mesh ref={footballRef} geometry={footballGeometry}>
        <shaderMaterial
          vertexShader={footballVertexShader}
          fragmentShader={footballFragmentShader}
          uniforms={uniforms.current.football}
          depthWrite={true}
        />
      </mesh>

      {/* Cheering Instanced Crowd */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[crowdPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[crowdColors, 3]}
          />
          <bufferAttribute
            attach="attributes-aRandoms"
            args={[crowdRandoms, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={crowdVertexShader}
          fragmentShader={crowdFragmentShader}
          uniforms={uniforms.current.crowd}
          transparent={true}
          vertexColors={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Fireworks Sparks system */}
      {fireworksActive && (
        <points ref={fireworksRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[fireworksPos, 3]}
            />
            <bufferAttribute
              attach="attributes-aVelocity"
              args={[fireworksVel, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[fireworksCol, 3]}
            />
            <bufferAttribute
              attach="attributes-aData"
              args={[fireworksData, 3]}
            />
          </bufferGeometry>
          <shaderMaterial
            vertexShader={fireworksVertexShader}
            fragmentShader={fireworksFragmentShader}
            uniforms={uniforms.current.fireworks}
            transparent={true}
            vertexColors={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* GPU Reassembly/Outline Nebula */}
      {stage >= 3 && (
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
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Shockwave Expansive ring */}
      <mesh ref={shockwaveRef} position={[0, 2.5, 4.4]} scale={[shockwaveScale, shockwaveScale, 1]} visible={shockwaveGlow > 0}>
        <ringGeometry args={[0.08, 1.4, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={shockwaveGlow * 0.75}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Spotlights */}
      <spotLight ref={spotlight1Ref} position={[-12, 10, -9]} intensity={stage === 2 ? 6.5 : 2.5} color="#fbbf24" angle={0.4} penumbra={0.6} />
      <spotLight ref={spotlight2Ref} position={[12, 10, -9]} intensity={stage === 2 ? 6.5 : 2.5} color="#f43f5e" angle={0.4} penumbra={0.6} />
      <spotLight ref={spotlight3Ref} position={[-12, 10, 9]} intensity={stage === 2 ? 6.5 : 2.5} color="#3b82f6" angle={0.4} penumbra={0.6} />
      <spotLight ref={spotlight4Ref} position={[12, 10, 9]} intensity={stage === 2 ? 6.5 : 2.5} color="#fbbf24" angle={0.4} penumbra={0.6} />
    </>
  );
}

// ---------------------------------------------------------------------
// 10. Main Interactive Wrapper Component
// ---------------------------------------------------------------------
export default function WorldCup3DIntro({ onComplete, isIntroActive }: WorldCup3DIntroProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);

  // Loading States
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cinematicStage, setCinematicStage] = useState(0); 
  // 0: Preloader/Black, 1: 360 Reveal, 2: Trophy Rise, 3: Kickoff / Fireworks, 4: Explosion / Reassembly, 5: Faded Background

  // Dynamic values animated by GSAP
  const [kickProgress, setKickProgress] = useState(0);
  const [trophyRise, setTrophyRise] = useState(0);
  const [ballZoom, setBallZoom] = useState(0);
  const [fireworksActive, setFireworksActive] = useState(false);
  const [shockwaveScale, setShockwaveScale] = useState(0.01);
  const [shockwaveGlow, setShockwaveGlow] = useState(0);
  const [particlesReassembly, setParticlesReassembly] = useState(0);

  // Screen effect state triggers
  const [triggerShake, setTriggerShake] = useState(false);
  const [triggerChromatic, setTriggerChromatic] = useState(false);

  const mouseRef = useRef({ x: 0, y: 0 });
  const hasBeenActiveRef = useRef(false);

  if (isIntroActive) {
    hasBeenActiveRef.current = true;
  }

  // 1. Preloader Liquid Loading Text Simulator
  useEffect(() => {
    if (!isIntroActive) return;

    console.log("[WorldCup3DIntro] Preloader starting. Initializing Crowd noise.");
    audioSynth.startCrowdRoar();

    let currentProgress = 0;
    let time = 0;
    let canvasAnimFrame: number;
    const width = 400;
    const height = 150;

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

      // Liquid golden fill mask
      ctx.save();
      ctx.beginPath();
      const waveHeight = height - (currentProgress / 100) * height;
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 8) {
        const y = waveHeight + Math.sin(x * 0.04 + time * 4.5) * 5.0;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.clip();

      // Shiny golden gradient text
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#fff6c2');
      grad.addColorStop(0.3, '#fbbf24');
      grad.addColorStop(0.7, '#d97706');
      grad.addColorStop(1, '#5a2300');
      ctx.fillStyle = grad;
      ctx.fillText('LOADING', width / 2, height / 2);

      // Sweep light reflection
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

        console.log("[WorldCup3DIntro] Preloader loading complete. Transitioning to reveal.");
        audioSynth.boostCrowdRoar();

        gsap.to(preloaderRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            setIsLoaded(true);
            setCinematicStage(1);
            startSequenceTimeline();
          }
        });
      } else {
        audioSynth.playTick();
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
    };
  }, []);

  // 2. Orchestrated GSAP Timelines
  const startSequenceTimeline = () => {
    const tl = gsap.timeline();
    activeTimeline.current = tl;

    // Stage 1 (360 Reveal) runs for 5 seconds
    tl.to({}, {
      duration: 5.0,
      onComplete: () => {
        // Advance to Stage 2: Trophy & Ball rise
        triggerTrophyRise();
      }
    });
  };

  const triggerTrophyRise = () => {
    setCinematicStage(2);
    console.log("[WorldCup3DIntro] Entering Stage 2: World Cup Trophy & Ball rising...");

    const tl = gsap.timeline();
    activeTimeline.current = tl;

    // Trophy rises from grass
    const riseObj = { val: 0 };
    tl.to(riseObj, {
      val: 1.0,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: () => setTrophyRise(riseObj.val)
    })
    // Maintain trophy view for 4.5 seconds before automatic kickoff
    .to({}, {
      duration: 4.5,
      onComplete: () => {
        triggerKickoff();
      }
    });
  };

  const [kickoffTriggered, setKickoffTriggered] = useState(false);

  const triggerKickoff = useCallback(() => {
    if (kickoffTriggered) return;
    setKickoffTriggered(true);

    if (activeTimeline.current) activeTimeline.current.kill();

    setCinematicStage(3); // Kickoff / Zoom
    console.log("[WorldCup3DIntro] KICKOFF TRIGGERED! Launching Kick and Fireworks...");

    const tl = gsap.timeline();
    activeTimeline.current = tl;

    // 1. Kicker plays bicycle kick rotation
    const kickObj = { val: 0 };
    tl.to(kickObj, {
      val: 1.0,
      duration: 0.7,
      ease: 'power1.inOut',
      onUpdate: () => setKickProgress(kickObj.val)
    })
    // 2. Ball zooms to camera (hits at t = 0.5s of the kick)
    const zoomObj = { val: 0 };
    tl.to(zoomObj, {
      val: 1.0,
      duration: 0.5,
      ease: 'power4.in',
      onStart: () => {
        audioSynth.playKick();
        audioSynth.boostCrowdRoar();
        setFireworksActive(true);
      },
      onUpdate: () => setBallZoom(zoomObj.val)
    }, '-=0.45')
    // 3. Screen Hit: Explosion -> Shockwave -> Camera Shake -> Chromatic aberration
    .to({}, {
      duration: 0.1,
      onStart: () => {
        setCinematicStage(4);
        setTriggerShake(true);
        setTriggerChromatic(true);
        console.log("[WorldCup3DIntro] Screen impact! Supernova shockwave active.");

        // disable shake after 600ms
        setTimeout(() => setTriggerShake(false), 650);
      }
    })
    // Expand golden shockwave ring
    const scaleObj = { val: 0.01 };
    const glowObj = { val: 1.5 };
    tl.to(scaleObj, {
      val: 6.0,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => setShockwaveScale(scaleObj.val)
    }, '-=0.1')
    .to(glowObj, {
      val: 0.0,
      duration: 0.8,
      ease: 'power2.in',
      onUpdate: () => setShockwaveGlow(glowObj.val)
    }, '-=0.9')
    // 4. Vortex particles reassemble into website Logo
    const reassemblyObj = { val: 0 };
    tl.to(reassemblyObj, {
      val: 1.0,
      duration: 2.2,
      ease: 'power3.inOut',
      onUpdate: () => setParticlesReassembly(reassemblyObj.val)
    }, '-=0.5')
    // 5. Wrap up, fade crowd sound, trigger dashboard stagger
    .to({}, {
      duration: 0.6,
      onStart: () => {
        audioSynth.fadeCrowdRoar();
        setTriggerChromatic(false);
      },
      onComplete: () => {
        setCinematicStage(5); // Ambient particle background mode
        onComplete();
      }
    });
  }, [kickoffTriggered, onComplete]);

  const handleSkip = () => {
    console.log("[WorldCup3DIntro] User clicked SKIP. Terminating timelines.");
    if (activeTimeline.current) activeTimeline.current.kill();
    audioSynth.fadeCrowdRoar();
    setCinematicStage(5);
    setIsLoaded(true);
    onComplete();
  };

  if (!isIntroActive && !hasBeenActiveRef.current) return null;

  const isBackgroundMode = cinematicStage === 5 || !isIntroActive;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full flex items-center justify-center font-sans overflow-hidden transition-all duration-1000 ${
        isBackgroundMode
          ? 'z-[0] pointer-events-none bg-transparent'
          : 'z-[9999] pointer-events-auto bg-[#04060c]'
      } ${triggerShake ? 'animate-screen-shake' : ''}`}
    >
      {/* 3D WebGL Canvas */}
      {isLoaded && (
        <div
          onClick={cinematicStage === 2 ? triggerKickoff : undefined}
          className={`absolute inset-0 w-full h-full z-10 ${cinematicStage === 2 ? 'cursor-pointer' : 'cursor-default'}`}
          title={cinematicStage === 2 ? "Click to kick off! ⚽" : undefined}
        >
          <Canvas
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 5, 13.5], fov: 60 }}
            dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1]}
          >
            <ambientLight intensity={0.25} />
            <directionalLight position={[-6, 8, 4]} intensity={1.2} />

            {/* Stadium Pitch */}
            <StadiumPitch />

            {/* Goal Posts */}
            <GoalPosts />

            {/* Procedural stands */}
            <StadiumStands />

            {/* Stadium Cheering Players */}
            {/* Team A (Crimson shirt) */}
            <PlayerModel position={[-3.5, 0, -2.5]} rotationY={1.2} />
            <PlayerModel position={[-7.0, 0, 1.0]} rotationY={0.9} />
            
            {/* Team B (Blue shirt) */}
            <PlayerModel position={[4.0, 0, -1.5]} rotationY={-1.1} />
            <PlayerModel position={[6.5, 0, 2.5]} rotationY={-0.8} />

            {/* Kicker Kicking Player at Center Spot */}
            <PlayerModel
              position={[0, 0, -0.65]}
              isKicker={true}
              kickProgress={kickProgress}
              rotationY={0.0}
            />

            {/* World Cup Trophy */}
            {cinematicStage >= 2 && (
              <WorldCupTrophy position={[0, 0, -2.0]} riseProgress={trophyRise} />
            )}

            {/* Custom Scene Logic & Particles */}
            <SceneContent
              stage={cinematicStage}
              mouse={mouseRef}
              kickProgress={kickProgress}
              trophyRise={trophyRise}
              ballZoom={ballZoom}
              fireworksActive={fireworksActive}
              shockwaveScale={shockwaveScale}
              shockwaveGlow={shockwaveGlow}
              particlesReassembly={particlesReassembly}
            />
          </Canvas>
        </div>
      )}

      {/* Loading Overlay */}
      {!isLoaded && (
        <div
          ref={preloaderRef}
          className="relative z-20 flex flex-col items-center justify-center text-center p-6"
        >
          <canvas ref={overlayCanvasRef} className="max-w-full drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]" />
          <div className="text-[#fbbf24] font-mono text-sm tracking-widest uppercase mt-4 font-bold">
            {loadingProgress}%
          </div>
          <div className="w-56 bg-white/5 h-[3px] rounded-full overflow-hidden mt-4 border border-white/[0.03] relative">
            <div
              className="bg-gradient-to-r from-amber-600 via-[#fbbf24] to-yellow-300 h-full transition-all duration-150 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-2.5">
            World Cup Stadium Entering...
          </div>
        </div>
      )}

      {/* Speed lines & Chromatic Aberration Simulation Overlays */}
      {cinematicStage === 3 && (
        <div className="absolute inset-0 z-15 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] opacity-80" />
      )}
      {triggerChromatic && (
        <div className="absolute inset-0 z-15 pointer-events-none border-[12px] border-red-500/15 mix-blend-screen animate-pulse" />
      )}

      {/* Skip button */}
      {!isBackgroundMode && (
        <button
          onClick={handleSkip}
          className="absolute top-8 right-8 z-30 px-5 py-2.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:bg-black/70 hover:border-[#fbbf24] hover:text-[#fbbf24] transition duration-300 text-xs font-black text-white/80 flex items-center gap-2 shadow-2xl"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip Intro ⚡
        </button>
      )}

      {/* Dynamic CSS styles for the screen-shake effect */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 4px) rotate(-0.3deg); }
          20%, 40%, 60%, 80% { transform: translate(4px, -4px) rotate(0.3deg); }
        }
        .animate-screen-shake {
          animation: screen-shake 0.6s ease-in-out;
        }
      `}} />
    </div>
  );
}

function StadiumPitch() {
  const pitchTexture = useMemo(() => createPitchTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 0]}>
      <planeGeometry args={[22, 16]} />
      {pitchTexture ? (
        <meshStandardMaterial map={pitchTexture} roughness={0.7} />
      ) : (
        <meshStandardMaterial color="#166534" roughness={0.7} />
      )}
    </mesh>
  );
}

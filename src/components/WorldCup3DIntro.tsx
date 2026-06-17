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
// 1. Procedural Texture Generators (AAA PBR Packings)
// ---------------------------------------------------------------------
function createConcreteTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#27272a';
  ctx.fillRect(0, 0, 512, 512);

  // Concrete noise
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 2 + 1;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, size, size);
  }

  // Cracks and lines
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, 0);
    ctx.lineTo(Math.random() * 512, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

function createPitchTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#15803d'; // turf green
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#166534'; // darker grass stripes
  const stripeW = 64;
  for (let x = 0; x < canvas.width; x += stripeW) {
    if ((x / stripeW) % 2 === 0) {
      ctx.fillRect(x, 0, stripeW, canvas.height);
    }
  }

  // White markings
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 5;

  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 20);
  ctx.lineTo(canvas.width / 2, canvas.height - 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Penalty Boxes
  ctx.strokeRect(20, canvas.height / 2 - 120, 160, 240);
  ctx.strokeRect(20, canvas.height / 2 - 60, 50, 120);
  ctx.strokeRect(canvas.width - 180, canvas.height / 2 - 120, 160, 240);
  ctx.strokeRect(canvas.width - 70, canvas.height / 2 - 60, 50, 120);

  return new THREE.CanvasTexture(canvas);
}

// ---------------------------------------------------------------------
// 2. Custom Volumetric Spotlight Shaders
// ---------------------------------------------------------------------
const volumetricVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const volumetricFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uGlow;
  uniform vec3 uColor;

  void main() {
    // Fade out down the length of the volumetric cone
    float distFade = smoothstep(12.0, 0.0, -vPosition.y);
    // Soft outer boundaries
    float edgeFade = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);

    gl_FragColor = vec4(uColor * uGlow, distFade * edgeFade * 0.22);
  }
`;

// ---------------------------------------------------------------------
// 3. Custom Skin Subsurface Scattering (SSS) & Sweat Shaders
// ---------------------------------------------------------------------
const skinVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const skinFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform vec3 uSkinColor;
  uniform float uSweatGlisten;
  uniform vec3 uLightPos;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(uLightPos - vPosition);

    // Standard diffuse light
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Subsurface scattering (SSS) approximation: red light bleeding when backlit
    float sss = pow(max(dot(viewDir, -lightDir), 0.0), 4.0) * 0.45;
    vec3 sssColor = vec3(0.95, 0.18, 0.12) * sss;

    // Specular sweat glisten (high specular, low roughness)
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 64.0) * uSweatGlisten;

    vec3 baseColor = uSkinColor * (diffuse + 0.15) + sssColor;
    baseColor += vec3(0.9, 0.95, 1.0) * specular * 0.8;

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

// ---------------------------------------------------------------------
// 4. Neon Football Shaders
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
      displacedPosition += normal * noiseVal * uDisplacementFactor * 0.15;
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

    // Carbon weave panel base texture
    vec2 weaveUv = vUv * 90.0;
    float wave1 = step(0.5, fract(weaveUv.x));
    float wave2 = step(0.5, fract(weaveUv.y));
    float weave = mix(0.04, 0.12, abs(wave1 - wave2));

    // Seam outline
    float pattern = sin(p.x * 6.5) * sin(p.y * 6.5) * sin(p.z * 6.5);
    float seam = smoothstep(0.0, 0.05, abs(pattern - 0.1));
    float seamMask = 1.0 - seam;

    vec3 gold = vec3(1.0, 0.75, 0.15);
    vec3 crimson = vec3(0.95, 0.05, 0.22);
    vec3 blue = vec3(0.12, 0.5, 0.98);

    float colorCycle = sin(uTime * 2.8 + p.y * 3.5) * 0.5 + 0.5;
    vec3 glowColor = mix(gold, mix(crimson, blue, step(0.5, colorCycle)), colorCycle);
    glowColor *= (1.0 + sin(uTime * 5.0) * 0.3);
    glowColor *= uGlowIntensity;

    vec3 panelColor = vec3(weave);
    vec3 finalColor = mix(panelColor, glowColor, seamMask * 0.95);

    // Fresnel Rim reflection
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    finalColor += glowColor * fresnel * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ---------------------------------------------------------------------
// 5. Crowd & Fireworks Shaders
// ---------------------------------------------------------------------
const crowdVertexShader = `
  attribute vec3 aRandoms; // x: speed, y: phase, z: seed
  uniform float uTime;
  varying vec3 vColor;
  varying float vFlash;

  void main() {
    vColor = color;
    vec3 pos = position;

    // Flag wave swing
    pos.y += sin(uTime * 4.0 * aRandoms.x + aRandoms.y) * 0.15;
    pos.x += cos(uTime * 2.5 * aRandoms.x + aRandoms.y) * 0.08;

    // Mobile/Flash bulb simulations
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
      // Mobile flashes
      finalColor *= (0.3 + vFlash * 1.7);
    } else {
      // Colors wave
      finalColor *= (0.75 + vFlash * 0.25);
    }
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const fireworksVertexShader = `
  attribute vec3 aVelocity;
  attribute vec3 aData; // x: delay, y: life, z: size
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

    pos += aVelocity * t;
    pos.y -= 4.9 * t * t; // gravity

    vFade = 1.0 - progress;

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

const particleVertexShader = `
  attribute vec3 aRandomDir;
  attribute vec3 aTrophyPos;
  attribute vec3 aLogoPos;
  attribute vec4 aRandomVal; // x: target ratio, y: speed, z: seed, w: edge divider

  uniform float uTime;
  uniform float uStage; // 0-2: Tunnel/Reveal, 3: Kick, 4: Reassembly, 5: UI outline
  uniform float uReassemblyTime;
  uniform float uZoomProgress;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 currentPos = position;

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
    else if (uStage < 3.5) {
      currentPos.z += aRandomVal.z * uZoomProgress * 30.0;
    }
    else if (uStage < 4.5) {
      vec3 targetPos = mix(aTrophyPos, aLogoPos, step(0.5, aRandomVal.x));
      currentPos = mix(currentPos, targetPos, clamp(uReassemblyTime, 0.0, 1.0));
    }
    else {
      vec3 targetPos = mix(aTrophyPos, aLogoPos, step(0.5, aRandomVal.x));
      vec3 edgePos = vec3(0.0);
      if (aRandomVal.w < 0.25) {
        edgePos = vec3(aRandomVal.z * 16.0 - 8.0, 4.5, 0.0);
      } else if (aRandomVal.w < 0.50) {
        edgePos = vec3(-8.2, aRandomVal.z * 10.0 - 5.0, 0.0);
      } else if (aRandomVal.w < 0.75) {
        edgePos = vec3(8.2, aRandomVal.z * 10.0 - 5.0, 0.0);
      } else {
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

    vColor = vec3(0.98, 0.78, 0.15);
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
// 6. Volumetric Spotlights & Geometries
// ---------------------------------------------------------------------
interface SpotlightProps {
  position: [number, number, number];
  targetPos: [number, number, number];
  color: string;
  glow: number;
}

function VolumetricSpotlight({ position, targetPos, color, glow }: SpotlightProps) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  const beamColor = useMemo(() => new THREE.Color(color), [color]);
  const beamGeometry = useMemo(() => {
    // Open cone for volumetric beam
    const geom = new THREE.CylinderGeometry(0.1, 3.5, 12.0, 16, 1, true);
    geom.translate(0, -6.0, 0); // origin at top vertex
    return geom;
  }, []);

  const uniforms = useRef({
    uGlow: { value: 0.0 },
    uColor: { value: beamColor }
  });

  useEffect(() => {
    uniforms.current.uGlow.value = glow;
  }, [glow]);

  useFrame(() => {
    if (lightRef.current && beamRef.current) {
      // Look at target position
      lightRef.current.target.position.set(...targetPos);
      lightRef.current.target.updateMatrixWorld();

      // Align volumetric cone mesh rotation with spotlight vector
      const dir = new THREE.Vector3().set(...targetPos).sub(lightRef.current.position).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      beamRef.current.quaternion.copy(quat);
    }
  });

  return (
    <group>
      <spotLight
        ref={lightRef}
        position={position}
        intensity={glow * 4.0}
        color={color}
        angle={0.45}
        penumbra={0.6}
        castShadow
      />
      {/* Volumetric mesh beam */}
      <mesh ref={beamRef} position={position} geometry={beamGeometry}>
        <shaderMaterial
          vertexShader={volumetricVertexShader}
          fragmentShader={volumetricFragmentShader}
          uniforms={uniforms.current}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function StadiumStands() {
  const standsGroup = useMemo(() => {
    const group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const radiusInner = 14.5 + i * 2.6;
      const radiusOuter = 16.5 + i * 2.6;
      const height = 0.5 + i * 1.5;
      const cylinder = new THREE.CylinderGeometry(radiusOuter, radiusInner, 1.2, 32, 1, true);
      cylinder.translate(0, height, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: '#090d18',
        roughness: 0.85,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      group.add(new THREE.Mesh(cylinder, mat));
    }
    return group;
  }, []);

  return <primitive object={standsGroup} />;
}

function PlayerTunnel() {
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.8,
    metalness: 0.1,
    map: createConcreteTexture()
  }), []);

  const puddleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#09090b',
    roughness: 0.02, // ultra shiny reflecting puddles
    metalness: 0.85
  }), []);

  return (
    <group>
      {/* Tunnel walls positioned behind stadium Z < 0 */}
      {/* Tunnel Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -7.5]} material={puddleMat}>
        <planeGeometry args={[5.5, 15]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -7.5]} material={wallMat}>
        <planeGeometry args={[6.5, 15]} />
      </mesh>
      {/* Tunnel Left Wall */}
      <mesh position={[-3.0, 1.6, -7.5]} rotation={[0, Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[15, 3.2]} />
      </mesh>
      {/* Tunnel Right Wall */}
      <mesh position={[3.0, 1.6, -7.5]} rotation={[0, -Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[15, 3.2]} />
      </mesh>
      {/* Tunnel Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, -7.5]} material={wallMat}>
        <planeGeometry args={[6.5, 15]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// 7. High-Fidelity Procedural Player Mesh (Sweat & SSS skin shaders)
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

  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: isKicker ? '#e11d48' : '#2563eb', roughness: 0.55 }), [isKicker]);
  const shortsMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 }), []);

  // Custom Skin Material using Subsurface Scattering and sweat glisten
  const skinMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: skinVertexShader,
      fragmentShader: skinFragmentShader,
      uniforms: {
        uSkinColor: { value: new THREE.Color('#fca5a5') }, // pinkish skin
        uSweatGlisten: { value: 0.8 },
        uLightPos: { value: new THREE.Vector3(0, 10, 11) } // stadium light center
      }
    });
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (!isKicker || kickProgress === 0) {
      const runSpeed = 11.5;
      const t = elapsed * runSpeed + runningOffset;
      const swingAngle = Math.sin(t) * 0.72;

      if (leftLegRef.current) leftLegRef.current.rotation.x = swingAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swingAngle;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swingAngle * 0.85;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swingAngle * 0.85;

      if (torsoRef.current) {
        torsoRef.current.position.y = 1.35 + Math.abs(Math.sin(t * 2.0)) * 0.08;
      }
    } else {
      // Bicycle flip kick interpolation
      const p = kickProgress;
      if (groupRef.current) {
        groupRef.current.position.y = position[1] + Math.sin(p * Math.PI) * 2.5;
        groupRef.current.rotation.x = -p * Math.PI * 1.5; // backflip
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -Math.sin(p * Math.PI) * 2.0; // kicking foot
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
      {/* Head with SSS skin */}
      <mesh position={[0, 1.85, 0]} material={skinMaterial}>
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
// 8. 24K Gold Lathe Trophy
// ---------------------------------------------------------------------
interface TrophyProps {
  position: [number, number, number];
  riseProgress: number;
}

function WorldCupTrophy({ position, riseProgress }: TrophyProps) {
  const trophyRef = useRef<THREE.Group>(null);

  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    metalness: 0.95, // high reflective gold
    roughness: 0.08,
    emissive: '#78350f',
    emissiveIntensity: 0.15
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
      <mesh position={[0, 1.25, 0]} material={goldMat}>
        <cylinderGeometry args={[0.3, 0.45, 1.0, 16]} />
      </mesh>
      <mesh position={[0, 1.8, 0]} material={goldMat}>
        <cylinderGeometry args={[0.55, 0.28, 0.3, 16]} />
      </mesh>
      <mesh position={[0, 2.3, 0]} material={goldMat}>
        <sphereGeometry args={[0.5, 16, 16]} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <sphereGeometry args={[0.52, 16, 16]} />
        <meshBasicMaterial color="#fef08a" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// 9. Interactive Scene Coordinator (with 30FPS throttling in background)
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
    }
  });

  // Calculate Crowd coordinates
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
      pos[i * 3 + 2] = Math.sin(angle) * radius * 0.76;

      const rVal = Math.random();
      let colorVal = new THREE.Color('#fbbf24');
      if (rVal < 0.25) colorVal.set('#fbbf24');
      else if (rVal < 0.50) colorVal.set('#f43f5e');
      else if (rVal < 0.75) colorVal.set('#3b82f6');
      else colorVal.set(1.7, 1.7, 1.7); // Phone flash bulbs

      col[i * 3] = colorVal.r;
      col[i * 3 + 1] = colorVal.g;
      col[i * 3 + 2] = colorVal.b;

      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random() * Math.PI * 2;
      rnd[i * 3 + 2] = Math.random();
    }

    return { crowdPositions: pos, crowdColors: col, crowdRandoms: rnd };
  }, []);

  // Calculate Fireworks coordinates
  const { fireworksPos, fireworksVel, fireworksCol, fireworksData } = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 1200 : 3500;

    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const dat = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
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

      dat[i * 3] = Math.random() * 0.8;
      dat[i * 3 + 1] = 1.0 + Math.random() * 1.5;
      dat[i * 3 + 2] = 4.0 + Math.random() * 5.0;
    }

    return { fireworksPos: pos, fireworksVel: vel, fireworksCol: col, fireworksData: dat };
  }, []);

  // Calculate GPU Reassembly coordinates
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

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 6.0 + 1.2;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      dirs[i3] = (Math.random() - 0.5) * 8.0;
      dirs[i3 + 1] = (Math.random() - 0.5) * 8.0;
      dirs[i3 + 2] = (Math.random() - 0.5) * 8.0;

      if (i < count * 0.6) {
        const h = Math.random() * 3.0 - 1.5;
        const cyR = 0.4 + Math.sin((h + 1.5) * 0.9) * 0.25;
        const a = Math.random() * Math.PI * 2;
        trophy[i3] = Math.cos(a) * cyR;
        trophy[i3 + 1] = h + 1.5;
        trophy[i3 + 2] = Math.sin(a) * cyR;
      } else {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(Math.random() * 2 - 1);
        const rGlob = 0.8;
        trophy[i3] = rGlob * Math.sin(ph) * Math.cos(th);
        trophy[i3 + 1] = 2.4 + rGlob * Math.sin(ph) * Math.sin(th);
        trophy[i3 + 2] = rGlob * Math.cos(ph);
      }

      const starAngle = Math.random() * Math.PI * 2;
      const numPoints = 8.0;
      const subAngle = Math.PI / numPoints;
      const starRBase = Math.cos(subAngle) / Math.cos(starAngle - subAngle * Math.floor((starAngle + subAngle) / (subAngle * 2.0)));
      const starRadius = (1.1 + Math.random() * 0.25) * starRBase;
      logo[i3] = Math.cos(starAngle) * starRadius;
      logo[i3 + 1] = Math.sin(starAngle) * starRadius + 1.2;
      logo[i3 + 2] = (Math.random() - 0.5) * 0.12;

      rVals[i4] = Math.random();
      rVals[i4 + 1] = Math.random() * 0.8 + 0.2;
      rVals[i4 + 2] = Math.random();
      rVals[i4 + 3] = Math.random();
    }

    return { positions: pos, randomDirs: dirs, trophyPositions: trophy, logoPositions: logo, randomVals: rVals };
  }, []);

  const lastFrameTime = useRef(0);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // R3F Render Throttling Lifecycle (Limit background rendering to 30 FPS at Stage 5 to save CPU/GPU)
    if (stage === 5) {
      const delta = elapsed - lastFrameTime.current;
      if (delta < 0.033) {
        state.gl.render(state.scene, state.camera);
        return;
      }
      lastFrameTime.current = elapsed;
    }

    // Update Spatial Audio listener coordinates to follow camera position and rotation quaternions
    audioSynth.updateListener(camera.position, camera.quaternion);

    uniforms.current.football.uTime.value = elapsed;
    uniforms.current.crowd.uTime.value = elapsed;
    uniforms.current.particles.uTime.value = elapsed;

    if (fireworksActive) {
      uniforms.current.fireworks.uTime.value += state.clock.getDelta();
    }

    uniforms.current.particles.uStage.value = stage;
    uniforms.current.particles.uReassemblyTime.value = particlesReassembly;
    uniforms.current.particles.uZoomProgress.value = ballZoom;

    // Cinematic Camera tracking per stage
    if (stage === 0) {
      // Tunnel View
      camera.position.set(0, 1.6, -11.0);
      camera.lookAt(0, 1.6, 0);
    } 
    else if (stage === 1) {
      // Sweep sweep 360-degree orbit
      const sweepAngle = elapsed * 0.38;
      camera.position.x = Math.sin(sweepAngle) * 13.5;
      camera.position.z = Math.cos(sweepAngle) * 13.5 + 11.0;
      camera.position.y = 5.0 + Math.sin(elapsed * 0.6) * 1.4;
      camera.lookAt(0, 1.2, 11.0);
    } 
    else if (stage === 2) {
      // Interactive close look around the trophy/ball
      camera.position.x += (mouse.current.x * 2.2 - camera.position.x) * 0.05;
      camera.position.y += (2.2 + mouse.current.y * 0.8 - camera.position.y) * 0.05;
      camera.position.z += (15.5 - camera.position.z) * 0.05;
      camera.lookAt(0, 1.5, 11.0);
    } 
    else if (stage === 3) {
      // Locked camera focus point
      camera.position.set(0, 2.3, 15.5);
      camera.lookAt(0, 1.6, 11.0);
    } 
    else if (stage >= 4) {
      // Pull back layout drift
      camera.position.x += (Math.sin(elapsed * 0.25) * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (2.8 + Math.cos(elapsed * 0.2) * 0.6 - camera.position.y) * 0.03;
      camera.position.z += (18.5 - camera.position.z) * 0.03;
      camera.lookAt(0, 1.4, 11.0);
    }

    // Ball movement calculations
    if (footballRef.current) {
      if (stage === 0 || stage === 1) {
        footballRef.current.position.set(0, 1.6 + Math.sin(elapsed * 2.0) * 0.15, 11.0);
        footballRef.current.rotation.y = elapsed * 0.35;
      } 
      else if (stage === 2) {
        footballRef.current.position.set(0, 2.3 + Math.sin(elapsed * 2.5) * 0.08, 11.0);
        footballRef.current.rotation.y = elapsed * 0.45;
      } 
      else if (stage === 3) {
        // Bicycle kick zoom past camera (starts at Z=11.0, hits camera around Z=15.5)
        const zPos = 11.0 + ballZoom * 8.5;
        const yPos = 2.2 - Math.sin(ballZoom * Math.PI) * 0.3 + ballZoom * 0.3;
        footballRef.current.position.set(0, yPos, zPos);
        footballRef.current.rotation.x = elapsed * 24.0;
        footballRef.current.rotation.y = elapsed * 8.0;

        if (ballZoom < 0.05) {
          uniforms.current.football.uDisplacementFactor.value = 1.2;
        } else {
          uniforms.current.football.uDisplacementFactor.value = 0.0;
        }
      } 
      else {
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
          <bufferAttribute attach="attributes-position" args={[crowdPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[crowdColors, 3]} />
          <bufferAttribute attach="attributes-aRandoms" args={[crowdRandoms, 3]} />
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

      {/* Volumetric Spotlights */}
      <VolumetricSpotlight position={[-12, 10, 2]} targetPos={[0, 0, 11]} color="#fbbf24" glow={stage === 2 ? 1.0 : 0.4} />
      <VolumetricSpotlight position={[12, 10, 2]} targetPos={[0, 0, 11]} color="#f43f5e" glow={stage === 2 ? 1.0 : 0.4} />
      <VolumetricSpotlight position={[-12, 10, 20]} targetPos={[0, 0, 11]} color="#3b82f6" glow={stage === 2 ? 1.0 : 0.4} />
      <VolumetricSpotlight position={[12, 10, 20]} targetPos={[0, 0, 11]} color="#fbbf24" glow={stage === 2 ? 1.0 : 0.4} />

      {/* Fireworks Sparks system */}
      {fireworksActive && (
        <points ref={fireworksRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[fireworksPos, 3]} />
            <bufferAttribute attach="attributes-aVelocity" args={[fireworksVel, 3]} />
            <bufferAttribute attach="attributes-color" args={[fireworksCol, 3]} />
            <bufferAttribute attach="attributes-aData" args={[fireworksData, 3]} />
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

      {/* GPU Reassembly System */}
      {stage >= 3 && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-aRandomDir" args={[randomDirs, 3]} />
            <bufferAttribute attach="attributes-aTrophyPos" args={[trophyPositions, 3]} />
            <bufferAttribute attach="attributes-aLogoPos" args={[logoPositions, 3]} />
            <bufferAttribute attach="attributes-aRandomVal" args={[randomVals, 4]} />
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

      {/* Volumetric Golden Shockwave Ring */}
      <mesh ref={shockwaveRef} position={[0, 2.5, 15.4]} scale={[shockwaveScale, shockwaveScale, 1]} visible={shockwaveGlow > 0}>
        <ringGeometry args={[0.08, 1.4, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={shockwaveGlow * 0.75}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------
// 10. Main Component Wrapper (with Visibility Lifecycle Throttling)
// ---------------------------------------------------------------------
export default function WorldCup3DIntro({ onComplete, isIntroActive }: WorldCup3DIntroProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);

  // States
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cinematicStage, setCinematicStage] = useState(0);

  const [kickProgress, setKickProgress] = useState(0);
  const [trophyRise, setTrophyRise] = useState(0);
  const [ballZoom, setBallZoom] = useState(0);
  const [fireworksActive, setFireworksActive] = useState(false);
  const [shockwaveScale, setShockwaveScale] = useState(0.01);
  const [shockwaveGlow, setShockwaveGlow] = useState(0);
  const [particlesReassembly, setParticlesReassembly] = useState(0);

  const [triggerShake, setTriggerShake] = useState(false);
  const [triggerChromatic, setTriggerChromatic] = useState(false);

  const mouseRef = useRef({ x: 0, y: 0 });
  const hasBeenActiveRef = useRef(false);

  if (isIntroActive) {
    hasBeenActiveRef.current = true;
  }

  // Page Visibility API lifecycle listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("[WorldCup3DIntro] Tab hidden: Suspending context.");
        if (audioSynth.init && (audioSynth as any).ctx) {
          (audioSynth as any).ctx.suspend().catch(() => {});
        }
      } else {
        console.log("[WorldCup3DIntro] Tab visible: Resuming context.");
        if (audioSynth.init && (audioSynth as any).ctx) {
          (audioSynth as any).ctx.resume().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      audioSynth.stopBreathing();
    };
  }, []);

  // Preloader Liquid Molten Gold text fill loop
  useEffect(() => {
    if (!isIntroActive) return;

    console.log("[WorldCup3DIntro] Cinematic tunnel started. Breathing procedural triggers.");
    audioSynth.startBreathing();

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

      // Background loading text
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.font = '900 68px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOADING', width / 2, height / 2);

      // Molten liquid glow fill mask
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

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#fff6c2');
      grad.addColorStop(0.3, '#fbbf24');
      grad.addColorStop(0.7, '#d97706');
      grad.addColorStop(1, '#5a2300');
      ctx.fillStyle = grad;
      ctx.fillText('LOADING', width / 2, height / 2);

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

        console.log("[WorldCup3DIntro] Preloader loading complete. Sprinting from tunnel mouth...");
        audioSynth.stopBreathing();
        audioSynth.startCrowdRoar();

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

  // Orchestrated GSAP Sequence
  const startSequenceTimeline = () => {
    const tl = gsap.timeline();
    activeTimeline.current = tl;

    // Stage 1 (Stadium Reveal / 360-degree sweep)
    tl.to({}, {
      duration: 5.0,
      onComplete: () => {
        triggerTrophyRise();
      }
    });
  };

  const triggerTrophyRise = () => {
    setCinematicStage(2);
    console.log("[WorldCup3DIntro] Stage 2: Trophy rising from pitch center circle.");

    const tl = gsap.timeline();
    activeTimeline.current = tl;

    const riseObj = { val: 0 };
    tl.to(riseObj, {
      val: 1.0,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: () => setTrophyRise(riseObj.val)
    })
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

    setCinematicStage(3); // Kickoff & Volumetric Fireworks
    console.log("[WorldCup3DIntro] Kickoff strike triggered. Slow-motion bicycle kick starting.");

    const tl = gsap.timeline();
    activeTimeline.current = tl;

    // 1. Kicker joints backflip rotation
    const kickObj = { val: 0 };
    tl.to(kickObj, {
      val: 1.0,
      duration: 0.7,
      ease: 'power1.inOut',
      onUpdate: () => setKickProgress(kickObj.val)
    })
    // 2. Ball zooms to camera (hits camera lens at t = 0.5s)
    const zoomObj = { val: 0 };
    tl.to(zoomObj, {
      val: 1.0,
      duration: 0.5,
      ease: 'power4.in',
      onStart: () => {
        audioSynth.playKick();
        audioSynth.boostCrowdRoar();
        setFireworksActive(true);

        // Localized firework explosions in 3D Space (Left/Right/Center)
        setTimeout(() => audioSynth.playFirework([-8, 8, 8]), 50);
        setTimeout(() => audioSynth.playFirework([8, 8, 8]), 150);
        setTimeout(() => audioSynth.playFirework([0, 10, 5]), 250);
      },
      onUpdate: () => setBallZoom(zoomObj.val)
    }, '-=0.45')
    // 3. Screen Hit: Explosion -> Volumetric Shockwave -> Shake -> Chromatic Aberration
    .to({}, {
      duration: 0.1,
      onStart: () => {
        setCinematicStage(4);
        setTriggerShake(true);
        setTriggerChromatic(true);
        setTimeout(() => setTriggerShake(false), 650);
      }
    })
    // Golden shockwave expands
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
        setCinematicStage(5); // Throttle R3F render loop to 30 FPS
        onComplete();
      }
    });
  }, [kickoffTriggered, onComplete]);

  const handleSkip = () => {
    console.log("[WorldCup3DIntro] Skip Intro triggered.");
    if (activeTimeline.current) activeTimeline.current.kill();
    audioSynth.fadeCrowdRoar();
    audioSynth.stopBreathing();
    setCinematicStage(5);
    setIsLoaded(true);
    onComplete();
  };

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
            camera={{ position: [0, 1.6, -11.0], fov: 60 }}
            dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1]}
          >
            <ambientLight intensity={0.25} />
            <directionalLight position={[-6, 8, 4]} intensity={1.2} />

            {/* Stadium Pitch */}
            <StadiumPitch />

            {/* Goal Posts */}
            <GoalPosts />

            {/* Tunnel preloader mesh walls */}
            <PlayerTunnel />

            {/* Procedural stands */}
            <StadiumStands />

            {/* Stadium Cheering Players */}
            {/* Team A (Red) */}
            <PlayerModel position={[-3.5, 0, 8.5]} rotationY={1.2} />
            <PlayerModel position={[-7.0, 0, 12.0]} rotationY={0.9} />
            
            {/* Team B (Blue) */}
            <PlayerModel position={[4.0, 0, 9.5]} rotationY={-1.1} />
            <PlayerModel position={[6.5, 0, 13.5]} rotationY={-0.8} />

            {/* Kicker Player at Center Spot */}
            <PlayerModel
              position={[0, 0, 10.35]}
              isKicker={true}
              kickProgress={kickProgress}
              rotationY={0.0}
            />

            {/* World Cup Trophy */}
            {cinematicStage >= 2 && (
              <WorldCupTrophy position={[0, 0, 9.0]} riseProgress={trophyRise} />
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 11.0]}>
      <planeGeometry args={[22, 16]} />
      {pitchTexture ? (
        <meshStandardMaterial map={pitchTexture} roughness={0.7} />
      ) : (
        <meshStandardMaterial color="#166534" roughness={0.7} />
      )}
    </mesh>
  );
}

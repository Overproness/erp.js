import { DragControls, Edges, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const CUBE_SIZE = 1.2;
const SPACING = 1.6;

export function Scene() {
  const [isDragging, setIsDragging] = useState(false);
  const animTime = useRef(0);

  // Two textures that together produce a cut-gemstone look:
  // bumpTexture  — each facet is a randomly tilted plane (distinct per-facet specular direction)
  // roughnessTexture — near-zero roughness at facet centres (mirror reflection), high at groove edges
  const { bumpTexture, roughnessTexture } = useMemo(() => {
    const size = 512;
    const cellSize = 52; // ~10 visible facets across a cube face

    // Deterministic hash (no Math.random, so texture is stable across renders)
    const hash = (a: number, b: number): number => {
      const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    const bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = size; bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext("2d")!;

    const roughCanvas = document.createElement("canvas");
    roughCanvas.width = size; roughCanvas.height = size;
    const roughCtx = roughCanvas.getContext("2d")!;

    const bumpData = bumpCtx.createImageData(size, size);
    const roughData = roughCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const cx = Math.floor(x / cellSize);
        const cy = Math.floor(y / cellSize);

        // Local position within cell [0..1]
        const lx = (x % cellSize) / cellSize;
        const ly = (y % cellSize) / cellSize;

        // Edge distance — drives groove depth and roughness boundary
        const edgeDist = Math.min(lx, 1 - lx, ly, 1 - ly);
        const grooveW = 0.09;
        const groove = edgeDist < grooveW ? edgeDist / grooveW : 1.0; // 0 at edge, 1 at centre

        // Each facet has a unique tilt direction and magnitude (like a cut gem face)
        const tiltAngle = hash(cx, cy) * Math.PI * 2;
        const tiltStrength = 0.45 + hash(cx + 7, cy + 3) * 0.55;
        const tilt = tiltStrength * (Math.cos(tiltAngle) * (lx - 0.5) + Math.sin(tiltAngle) * (ly - 0.5));

        // Intra-facet micro-grain (very subtle, adds realism)
        const grain = (Math.random() - 0.5) * 10;

        // Groove depression: edges are recessed (darker bump = lower surface)
        const bv = Math.min(255, Math.max(0, Math.floor((128 + 68 * tilt + grain) * (0.08 + 0.92 * groove))));
        bumpData.data[idx] = bv;
        bumpData.data[idx + 1] = bv;
        bumpData.data[idx + 2] = bv;
        bumpData.data[idx + 3] = 255;

        // Roughness map: bright (rough) at grooves, near-black (mirror) inside facets
        // three.js: finalRoughness = material.roughness * map.green
        const rv = Math.floor((1.0 - groove) * 210 + groove * 6);
        roughData.data[idx] = rv;
        roughData.data[idx + 1] = rv;
        roughData.data[idx + 2] = rv;
        roughData.data[idx + 3] = 255;
      }
    }

    bumpCtx.putImageData(bumpData, 0, 0);
    roughCtx.putImageData(roughData, 0, 0);

    const makeTexture = (canvas: HTMLCanvasElement) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = 16;
      return tex;
    };

    return { bumpTexture: makeTexture(bumpCanvas), roughnessTexture: makeTexture(roughCanvas) };
  }, []);

  // Generate initial positions for a 5x5x5 grid
  const cubes = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -2; z <= 2; z++) {
          // Skip some cubes to make it look more organic like the video
          if (Math.random() > 0.5) continue;

          pos.push(
            new THREE.Vector3(
              x * SPACING + (Math.random() - 0.5) * 0.5,
              y * SPACING + (Math.random() - 0.5) * 0.5,
              z * SPACING + (Math.random() - 0.5) * 0.5,
            ),
          );
        }
      }
    }
    // Ensure we have at least some cubes
    if (pos.length < 10) {
      for (let i = 0; i < 10 - pos.length; i++) {
        pos.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
          ),
        );
      }
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    animTime.current += delta * 0.12; // Speed of the loop (slowed down)

    const t = animTime.current;

    const baseRadius = 15;

    // 1. Z-axis / distance oscillation (moves in and out) - smoother
    const radius = baseRadius + Math.sin(t * 0.5) * 2;

    // 2. Continuous rotation around the Y axis (xy-plane equivalent in 3D)
    const theta = t;

    // 3. Diagonal/elevation oscillation (moves up and down) - more pronounced
    const phi = Math.sin(t * 0.8) * 0.8;

    // Convert Spherical coordinates to Cartesian for the camera
    state.camera.position.x = radius * Math.cos(phi) * Math.sin(theta);
    state.camera.position.y = radius * Math.sin(phi);
    state.camera.position.z = radius * Math.cos(phi) * Math.cos(theta);

    // Always look at the center of the structure
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group>
      {cubes.map((pos, i) => (
        <InteractiveCube
          key={i}
          position={pos}
          setIsDragging={setIsDragging}
          bumpTexture={bumpTexture}
          roughnessTexture={roughnessTexture}
        />
      ))}
    </group>
  );
}

function InteractiveCube({
  position,
  setIsDragging,
  bumpTexture,
  roughnessTexture,
}: {
  position: THREE.Vector3;
  setIsDragging: (dragging: boolean) => void;
  bumpTexture: THREE.Texture;
  roughnessTexture: THREE.Texture;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [localPos, setLocalPos] = useState(position);

  // Floating animation offset so they don't all wobble identically
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (ref.current) {
      // 1. Max bound for dragging
      const limit = 8;
      ref.current.position.x = THREE.MathUtils.clamp(
        ref.current.position.x,
        -limit,
        limit,
      );
      ref.current.position.y = THREE.MathUtils.clamp(
        ref.current.position.y,
        -limit,
        limit,
      );
      ref.current.position.z = THREE.MathUtils.clamp(
        ref.current.position.z,
        -limit,
        limit,
      );

      if (!dragged) {
        const t = state.clock.getElapsedTime() + randomOffset;
        // Slight rotation wobble
        ref.current.rotation.x = Math.sin(t * 0.5) * 0.1;
        ref.current.rotation.y = Math.cos(t * 0.5) * 0.1;
      }
    }
  });

  return (
    <DragControls
      onDragStart={() => {
        setDragged(true);
        setIsDragging(true);
        document.body.style.cursor = "grabbing";
      }}
      onDragEnd={() => {
        setDragged(false);
        setIsDragging(false);
        document.body.style.cursor = hovered ? "grab" : "auto";
        if (ref.current) {
          setLocalPos(ref.current.position.clone());
        }
      }}
    >
      <RoundedBox
        ref={ref}
        position={localPos}
        args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]}
        radius={0.15}
        smoothness={4}
        onPointerOver={() => {
          setHovered(true);
          if (!dragged) document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!dragged) document.body.style.cursor = "auto";
        }}
      >
        <meshPhysicalMaterial
          color="#006FCA"
          transmission={0.6}
          ior={1.65}
          thickness={0.8}
          attenuationColor="#66aaff"
          attenuationDistance={14.0}
          metalness={0.0}
          roughness={0.25}
          roughnessMap={roughnessTexture}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          envMapIntensity={5.0}
          iridescence={1.0}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[150, 550]}
          bumpMap={bumpTexture}
          bumpScale={0.12}
        />
        <Edges scale={1.0} threshold={15}>
          <lineBasicMaterial color="#00ddff" transparent opacity={0.75} />
        </Edges>
      </RoundedBox>
    </DragControls>
  );
}

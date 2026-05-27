// @ts-nocheck
import { DragControls, Edges, Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const CUBE_SIZE = 1.5;
const SPACING = 1.4;

function CrystalScene() {
  const animTime = useRef(0);
  const isDragging = useRef(false);

  const { bumpTexture, roughnessTexture } = useMemo(() => {
    const size = 512;
    const cellSize = 52;

    const hash = (a: number, b: number): number => {
      const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d')!;

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const roughCtx = roughCanvas.getContext('2d')!;

    const bumpData = bumpCtx.createImageData(size, size);
    const roughData = roughCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const cx = Math.floor(x / cellSize);
        const cy = Math.floor(y / cellSize);
        const lx = (x % cellSize) / cellSize;
        const ly = (y % cellSize) / cellSize;
        const edgeDist = Math.min(lx, 1 - lx, ly, 1 - ly);
        const grooveW = 0.09;
        const groove = edgeDist < grooveW ? edgeDist / grooveW : 1.0;
        const tiltAngle = hash(cx, cy) * Math.PI * 2;
        const tiltStrength = 0.45 + hash(cx + 7, cy + 3) * 0.55;
        const tilt =
          tiltStrength * (Math.cos(tiltAngle) * (lx - 0.5) + Math.sin(tiltAngle) * (ly - 0.5));
        const grain = (Math.random() - 0.5) * 10;
        const bv = Math.min(
          255,
          Math.max(0, Math.floor((128 + 68 * tilt + grain) * (0.08 + 0.92 * groove)))
        );
        bumpData.data[idx] = bv;
        bumpData.data[idx + 1] = bv;
        bumpData.data[idx + 2] = bv;
        bumpData.data[idx + 3] = 255;
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

    return {
      bumpTexture: makeTexture(bumpCanvas),
      roughnessTexture: makeTexture(roughCanvas),
    };
  }, []);

  const cubes = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed) * 43758.5453;
      return x - Math.floor(x);
    };
    let seed = 42;
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -2; z <= 2; z++) {
          seed++;
          if (rng(seed) > 0.32) continue;
          pos.push(
            new THREE.Vector3(
              x * SPACING + (rng(seed + 100) - 0.5) * 0.5,
              y * SPACING + (rng(seed + 200) - 0.5) * 0.5,
              z * SPACING + (rng(seed + 300) - 0.5) * 0.5
            )
          );
        }
      }
    }
    if (pos.length < 8) {
      for (let i = 0; i < 8; i++) {
        pos.push(
          new THREE.Vector3(
            (rng(i + 1000) - 0.5) * 3,
            (rng(i + 2000) - 0.5) * 3,
            (rng(i + 3000) - 0.5) * 3
          )
        );
      }
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (isDragging.current) return;
    animTime.current += delta * 0.12;
    const t = animTime.current;
    const baseRadius = 15;
    const radius = baseRadius + Math.sin(t * 0.5) * 2;
    const theta = t;
    const phi = Math.sin(t * 0.8) * 0.8;
    state.camera.position.x = -(radius * Math.cos(phi) * Math.sin(theta));
    state.camera.position.y = radius * Math.sin(phi);
    state.camera.position.z = -(radius * Math.cos(phi) * Math.cos(theta));
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group>
      {cubes.map((pos, i) => (
        <CrystalCube
          key={i}
          position={pos}
          bumpTexture={bumpTexture}
          roughnessTexture={roughnessTexture}
          index={i}
          setIsDragging={(v) => {
            isDragging.current = v;
          }}
        />
      ))}
    </group>
  );
}

function CrystalCube({
  position,
  bumpTexture,
  roughnessTexture,
  index,
  setIsDragging,
}: {
  position: THREE.Vector3;
  bumpTexture: THREE.Texture;
  roughnessTexture: THREE.Texture;
  index: number;
  setIsDragging: (v: boolean) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const randomOffset = useMemo(() => index * 1.7, [index]);
  const [dragged, setDragged] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [localPos] = useState(() => position.clone());

  useFrame((state) => {
    if (ref.current) {
      const limit = 8;
      ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x, -limit, limit);
      ref.current.position.y = THREE.MathUtils.clamp(ref.current.position.y, -limit, limit);
      ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z, -limit, limit);
      if (!dragged) {
        const t = state.clock.getElapsedTime() + randomOffset;
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
        document.body.style.cursor = 'grabbing';
      }}
      onDragEnd={() => {
        setDragged(false);
        setIsDragging(false);
        document.body.style.cursor = hovered ? 'grab' : 'auto';
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
          if (!dragged) document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!dragged) document.body.style.cursor = 'auto';
        }}
      >
        <meshPhysicalMaterial
          color="#0058c3"
          transmission={0.6}
          ior={1.65}
          thickness={0.8}
          attenuationColor="#0070f3"
          attenuationDistance={14.0}
          metalness={0.0}
          roughness={0.25}
          roughnessMap={roughnessTexture}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          envMapIntensity={2.5}
          iridescence={1.0}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[150, 550]}
          bumpMap={bumpTexture}
          bumpScale={0.12}
        />
        <Edges scale={1.0} threshold={15}>
          <lineBasicMaterial color="#0070f3" transparent opacity={0.6} />
        </Edges>
      </RoundedBox>
    </DragControls>
  );
}

export default function HeroScene({ onReady }: { onReady?: () => void }) {
  return (
    <div className="w-full h-full" style={{ minHeight: '500px' }}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 16], zoom: 40 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, toneMappingExposure: 0.85 }}
        onCreated={() => onReady?.()}
      >
        <ambientLight intensity={0.25} color="#c8deff" />
        <directionalLight
          position={[8, 12, 12]}
          intensity={0.7}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <CrystalScene />
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <Lightformer
              intensity={1.8}
              rotation-x={Math.PI / 2}
              position={[0, 8, -8]}
              scale={[16, 16, 1]}
              color="#ffffff"
            />
            <Lightformer
              intensity={1.2}
              rotation-y={Math.PI / 2}
              position={[-8, 2, 0]}
              scale={[20, 6, 1]}
              color="#88ccff"
            />
            <Lightformer
              intensity={1.2}
              rotation-y={-Math.PI / 2}
              position={[8, 2, 0]}
              scale={[20, 6, 1]}
              color="#88ccff"
            />
            <Lightformer
              intensity={0.8}
              rotation-x={-Math.PI / 4}
              position={[0, -4, 6]}
              scale={[14, 4, 1]}
              color="#b0d8ff"
            />
          </group>
        </Environment>
        <EffectComposer>
          <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.75} height={300} intensity={0.65} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

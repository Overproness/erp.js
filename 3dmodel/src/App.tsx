/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Scene } from "./Scene";

export default function App() {
  return (
    <div
      className="w-full h-screen overflow-hidden touch-none"
      style={{
        background:
          "linear-gradient(135deg, #f3f4f5 0%, #e8edf5 60%, #dce6f5 100%)",
      }}
    >
      <Canvas orthographic camera={{ position: [0, 0, 16], zoom: 40 }}>
        {/* Ambient fill — low, just to prevent pure-black shadows */}
        <ambientLight intensity={0.25} color="#c8deff" />
        {/* Single directional light matching Spline config: white #FFFFFF, intensity 0.70,
            position (200,300,300) → normalized to scene scale, penumbra 0.50, soft shadows */}
        <directionalLight
          position={[8, 12, 12]}
          intensity={0.7}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={60}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-radius={4}
        />
        <Scene />
        <Environment resolution={512}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {/* Key overhead — drives the bright matcap-like top highlight */}
            <Lightformer
              intensity={2.5}
              rotation-x={Math.PI / 2}
              position={[0, 8, -8]}
              scale={[16, 16, 1]}
              color="#ffffff"
            />
            {/* Left rim — feeds iridescence from the side */}
            <Lightformer
              intensity={1.5}
              rotation-y={Math.PI / 2}
              position={[-8, 2, 0]}
              scale={[20, 6, 1]}
              color="#88ccff"
            />
            {/* Right rim */}
            <Lightformer
              intensity={1.5}
              rotation-y={-Math.PI / 2}
              position={[8, 2, 0]}
              scale={[20, 6, 1]}
              color="#88ccff"
            />
            {/* Front low — catches the rounded bottom corners */}
            <Lightformer
              intensity={1.0}
              rotation-x={-Math.PI / 4}
              position={[0, -4, 6]}
              scale={[14, 4, 1]}
              color="#b0d8ff"
            />
          </group>
        </Environment>
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.75}
            height={300}
            intensity={0.65}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

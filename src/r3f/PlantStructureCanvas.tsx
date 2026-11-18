import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { createProceduralTextures } from '../three/proceduralTextures';

export type PlantBayId = 'bay-01' | 'bay-02' | 'bay-03' | 'bay-04' | 'bay-05';

export const PLANT_BAY_CAMERA: Record<PlantBayId | 'overview', { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [7.6, 5.2, 8.8], target: [0, 0.65, 0] },
  'bay-01': { pos: [2.8, 3.2, 4.9], target: [-2.2, 0.7, 1.3] },
  'bay-02': { pos: [1.6, 3.3, 4.4], target: [-3.4, 0.7, -1.5] },
  'bay-03': { pos: [3.2, 3.4, 4.1], target: [0.3, 0.8, -1.6] },
  'bay-04': { pos: [5.4, 3.6, 4.4], target: [2.8, 0.9, -1.5] },
  'bay-05': { pos: [5.2, 3.1, 5.2], target: [2.3, 0.65, 1.4] },
};

function detectSoftwareWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return true;
  }
}

const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();

interface PlantSceneProps {
  activeBay: PlantBayId | null;
  onSelectBay: (bay: PlantBayId) => void;
  swGl: boolean;
}

const PlantSceneContent: React.FC<PlantSceneProps> = ({ activeBay, onSelectBay, swGl }) => {
  const { gl, camera, invalidate } = useThree();
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const coilReelRef = useRef<THREE.Group>(null);
  const trolleyRef = useRef<THREE.Group>(null);
  const camActiveRef = useRef(false);
  const prevBayRef = useRef<PlantBayId | null>(activeBay);

  const textures = useMemo(() => {
    return createProceduralTextures(gl.capabilities.getMaxAnisotropy());
  }, [gl]);

  useEffect(() => {
    return () => {
      textures.dispose();
    };
  }, [textures]);

  useEffect(() => {
    if (prevBayRef.current !== activeBay) {
      prevBayRef.current = activeBay;
      camActiveRef.current = true;
      invalidate();
    }
  }, [activeBay, invalidate]);

  useEffect(() => {
    if (!swGl) return;
    const timer = window.setInterval(() => invalidate(), 95);
    return () => window.clearInterval(timer);
  }, [swGl, invalidate]);

  // Shared materials calibrated with >= 0.25 roughness differentiation
  const mats = useMemo(() => {
    return {
      slab: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.9, metalness: 0.04 }),
      pad: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.78, metalness: 0.06 }),
      padActive: new THREE.MeshStandardMaterial({ color: '#fee2e2', roughness: 0.65, metalness: 0.08 }),
      truss: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.45, metalness: 0.72 }),
      galvSteel: new THREE.MeshStandardMaterial({
        map: textures.galvanizedColor,
        roughnessMap: textures.galvanizedRoughness,
        metalness: 0.92,
        roughness: 0.24,
      }),
      machineryDark: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.42, metalness: 0.78 }),
      crimsonAccent: new THREE.MeshStandardMaterial({ color: '#C8102E', roughness: 0.34, metalness: 0.35 }),
      craneAmber: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.38, metalness: 0.45 }),
    };
  }, [textures]);

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.08);
    if (coilReelRef.current) {
      coilReelRef.current.rotation.z -= dt * 0.65;
    }
    if (trolleyRef.current) {
      trolleyRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.45) * 0.9;
    }
    if (camActiveRef.current) {
      const cfg = PLANT_BAY_CAMERA[activeBay ?? 'overview'];
      _camGoal.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      _targetGoal.set(cfg.target[0], cfg.target[1], cfg.target[2]);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 4.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 4.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 4.5, dt);

      if (controlsRef.current) {
        controlsRef.current.target.x = THREE.MathUtils.damp(controlsRef.current.target.x, _targetGoal.x, 4.5, dt);
        controlsRef.current.target.y = THREE.MathUtils.damp(controlsRef.current.target.y, _targetGoal.y, 4.5, dt);
        controlsRef.current.target.z = THREE.MathUtils.damp(controlsRef.current.target.z, _targetGoal.z, 4.5, dt);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(_camGoal) < 0.04) {
        camActiveRef.current = false;
      }
    }
  });

  const isSelected = (bay: PlantBayId) => activeBay === bay;

  return (
    <>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.1} position={[-5, 7, 5]} scale={[9, 5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[6, 4, -4]} scale={[7, 4, 1]} color="#fff7ed" />
      </Environment>

      <hemisphereLight args={['#f1f5f9', '#94a3b8', 0.95]} />
      <directionalLight position={[6, 9, 6]} intensity={1.9} color="#fff9f2" castShadow={!swGl} />
      <directionalLight position={[-5, 4, -5]} intensity={1.0} color="#dbeafe" />

      {/* Ground Slab & Structural Steel Portal Truss Columns */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, -0.06, 0]} receiveShadow material={mats.slab}>
          <boxGeometry args={[10.4, 0.12, 6.2]} />
        </mesh>

        {/* Perimeter Steel Portal Columns & Overhead Crane Runway Rails */}
        {[-4.8, 0, 4.8].map((x) =>
          [-2.85, 2.85].map((z) => (
            <group key={`col-${x}-${z}`} position={[x, 1.4, z]}>
              <mesh material={mats.truss} castShadow>
                <boxGeometry args={[0.14, 2.8, 0.18]} />
              </mesh>
              <mesh position={[0, -1.36, 0]} material={mats.machineryDark}>
                <boxGeometry args={[0.26, 0.08, 0.28]} />
              </mesh>
            </group>
          ))
        )}

        {/* Overhead Gantry Runway Beams */}
        {[-2.85, 2.85].map((z) => (
          <mesh key={`rail-${z}`} position={[0, 2.75, z]} material={mats.truss}>
            <boxGeometry args={[9.75, 0.14, 0.16]} />
          </mesh>
        ))}

        {/* Moving Overhead Crane Bridge in Bay 04 Zone */}
        <group ref={trolleyRef} position={[2.8, 2.86, 0]}>
          <mesh material={mats.craneAmber}>
            <boxGeometry args={[3.4, 0.16, 0.24]} />
          </mesh>
          <mesh position={[0, -0.22, 0]} material={mats.machineryDark}>
            <boxGeometry args={[0.42, 0.28, 0.36]} />
          </mesh>
        </group>

        {/* BAY 01: Continuous Cold Roll-Forming Line (5+ Automated Mills) */}
        <group
          position={[-2.2, 0.02, 1.35]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectBay('bay-01');
          }}
        >
          <mesh position={[0, 0.02, 0]} material={isSelected('bay-01') ? mats.padActive : mats.pad} receiveShadow>
            <boxGeometry args={[4.6, 0.04, 1.9]} />
          </mesh>
          {/* Heavy Roll-Forming Bed Frame */}
          <mesh position={[0, 0.26, 0]} material={mats.machineryDark} castShadow>
            <boxGeometry args={[4.1, 0.44, 0.72]} />
          </mesh>
          {/* 6 Sequential Hardened Roller Stands */}
          {[-1.55, -0.95, -0.35, 0.25, 0.85, 1.45].map((sx, idx) => (
            <group key={`stand-${idx}`} position={[sx, 0.66, 0]}>
              <mesh material={isSelected('bay-01') ? mats.crimsonAccent : mats.truss} castShadow>
                <boxGeometry args={[0.18, 0.42, 0.76]} />
              </mesh>
              <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.galvSteel}>
                <cylinderGeometry args={[0.085, 0.085, 0.56, 16]} />
              </mesh>
              <mesh position={[0, -0.09, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.galvSteel}>
                <cylinderGeometry args={[0.085, 0.085, 0.56, 16]} />
              </mesh>
            </group>
          ))}
          {/* Forming Galvanized Steel Profile Exiting Line */}
          <mesh position={[0.35, 0.66, 0]} material={mats.galvSteel}>
            <boxGeometry args={[4.4, 0.055, 0.14]} />
          </mesh>
        </group>

        {/* BAY 02: Rotary Coil Slitting & Flying Shear Unit */}
        <group
          position={[-3.35, 0.02, -1.45]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectBay('bay-02');
          }}
        >
          <mesh position={[0, 0.02, 0]} material={isSelected('bay-02') ? mats.padActive : mats.pad} receiveShadow>
            <boxGeometry args={[2.5, 0.04, 1.95]} />
          </mesh>
          {/* Master Decoiler Mandrel & Rotating Coil */}
          <mesh position={[-0.72, 0.35, 0]} material={mats.machineryDark} castShadow>
            <boxGeometry args={[0.55, 0.62, 0.85]} />
          </mesh>
          <group ref={coilReelRef} position={[-0.72, 0.72, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.galvSteel} castShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.52, 24]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={isSelected('bay-02') ? mats.crimsonAccent : mats.machineryDark}>
              <cylinderGeometry args={[0.16, 0.16, 0.56, 16]} />
            </mesh>
          </group>
          {/* Rotary Arbor Slitter Stand */}
          <mesh position={[0.45, 0.54, 0]} material={isSelected('bay-02') ? mats.crimsonAccent : mats.truss} castShadow>
            <boxGeometry args={[0.78, 1.0, 0.92]} />
          </mesh>
          <mesh position={[0.45, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.galvSteel}>
            <cylinderGeometry args={[0.11, 0.11, 0.74, 16]} />
          </mesh>
        </group>

        {/* BAY 03: Mechanical Press Tool & Inline Slot-Punching Station */}
        <group
          position={[0.15, 0.02, -1.45]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectBay('bay-03');
          }}
        >
          <mesh position={[0, 0.02, 0]} material={isSelected('bay-03') ? mats.padActive : mats.pad} receiveShadow>
            <boxGeometry args={[2.4, 0.04, 1.95]} />
          </mesh>
          {/* C-Frame Press Columns & Bolster */}
          <mesh position={[0, 0.24, 0]} material={mats.machineryDark} castShadow>
            <boxGeometry args={[1.35, 0.4, 0.96]} />
          </mesh>
          <mesh position={[-0.48, 0.88, 0]} material={isSelected('bay-03') ? mats.crimsonAccent : mats.truss} castShadow>
            <boxGeometry args={[0.24, 0.92, 0.78]} />
          </mesh>
          <mesh position={[0.48, 0.88, 0]} material={isSelected('bay-03') ? mats.crimsonAccent : mats.truss} castShadow>
            <boxGeometry args={[0.24, 0.92, 0.78]} />
          </mesh>
          {/* Press Crown & Die Ram */}
          <mesh position={[0, 1.42, 0]} material={mats.machineryDark} castShadow>
            <boxGeometry args={[1.38, 0.34, 0.86]} />
          </mesh>
          <mesh position={[0, 0.82, 0]} material={mats.galvSteel}>
            <boxGeometry args={[0.62, 0.28, 0.44]} />
          </mesh>
          {/* Side Flywheel */}
          <mesh position={[0.72, 1.38, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.crimsonAccent}>
            <cylinderGeometry args={[0.28, 0.28, 0.12, 22]} />
          </mesh>
        </group>

        {/* BAY 04: Weather-Sheltered Master GI Coil Storage & Cradle Racks */}
        <group
          position={[3.15, 0.02, -1.45]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectBay('bay-04');
          }}
        >
          <mesh position={[0, 0.02, 0]} material={isSelected('bay-04') ? mats.padActive : mats.pad} receiveShadow>
            <boxGeometry args={[2.7, 0.04, 1.95]} />
          </mesh>
          {/* Cradle Rack Beams */}
          <mesh position={[0, 0.16, -0.35]} material={mats.truss}>
            <boxGeometry args={[2.2, 0.24, 0.14]} />
          </mesh>
          <mesh position={[0, 0.16, 0.35]} material={mats.truss}>
            <boxGeometry args={[2.2, 0.24, 0.14]} />
          </mesh>
          {/* 3 Heavy Galvanized Steel Master Coils */}
          {[-0.72, 0, 0.72].map((cx, idx) => (
            <group key={`coil-${idx}`} position={[cx, 0.56, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.galvSteel} castShadow>
                <cylinderGeometry args={[0.33, 0.33, 0.62, 22]} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={isSelected('bay-04') ? mats.crimsonAccent : mats.machineryDark}>
                <cylinderGeometry args={[0.12, 0.12, 0.65, 14]} />
              </mesh>
            </group>
          ))}
        </group>

        {/* BAY 05: Integrated Quality Control Lab & Bundled Dispatch Rack */}
        <group
          position={[2.35, 0.02, 1.35]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectBay('bay-05');
          }}
        >
          <mesh position={[0, 0.02, 0]} material={isSelected('bay-05') ? mats.padActive : mats.pad} receiveShadow>
            <boxGeometry args={[3.8, 0.04, 1.9]} />
          </mesh>
          {/* Precision Inspection Table */}
          <mesh position={[-0.85, 0.42, 0]} material={mats.machineryDark} castShadow>
            <boxGeometry args={[1.65, 0.12, 0.85]} />
          </mesh>
          {[-1.55, -0.15].map((lx) =>
            [-0.32, 0.32].map((lz) => (
              <mesh key={`leg-${lx}-${lz}`} position={[lx, 0.2, lz]} material={mats.truss}>
                <boxGeometry args={[0.08, 0.36, 0.08]} />
              </mesh>
            ))
          )}
          {/* Sample Inspection Bars on Table */}
          <mesh position={[-0.85, 0.54, 0]} material={mats.galvSteel}>
            <boxGeometry args={[1.35, 0.08, 0.2]} />
          </mesh>
          <mesh position={[-0.85, 0.64, 0]} material={isSelected('bay-05') ? mats.crimsonAccent : mats.truss}>
            <boxGeometry args={[0.14, 0.18, 0.26]} />
          </mesh>

          {/* Strapped Finished Dispatch Bundles Ready for TN / KL / KA / AP */}
          {[0.18, 0.44].map((by, row) => (
            <group key={`bundle-${row}`} position={[0.92, by, 0]}>
              <mesh material={mats.galvSteel} castShadow>
                <boxGeometry args={[1.45, 0.2, 0.72]} />
              </mesh>
              <mesh position={[-0.45, 0, 0]} material={mats.crimsonAccent}>
                <boxGeometry args={[0.04, 0.22, 0.75]} />
              </mesh>
              <mesh position={[0.45, 0, 0]} material={mats.crimsonAccent}>
                <boxGeometry args={[0.04, 0.22, 0.75]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping={!swGl}
        dampingFactor={0.06}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.44}
        target={[0, 0.65, 0]}
        onStart={() => {
          camActiveRef.current = false;
        }}
        onChange={() => {
          if (swGl) invalidate();
        }}
      />
    </>
  );
};

interface PlantStructureCanvasProps {
  activeBay: PlantBayId | null;
  onSelectBay: (bay: PlantBayId) => void;
}

export const PlantStructureCanvas: React.FC<PlantStructureCanvasProps> = ({ activeBay, onSelectBay }) => {
  const swGl = useMemo(() => detectSoftwareWebGL(), []);

  return (
    <Canvas
      dpr={swGl ? 1 : [1, 2]}
      frameloop={swGl ? 'demand' : 'always'}
      shadows={!swGl}
      camera={{ position: PLANT_BAY_CAMERA.overview.pos, fov: 36, near: 0.1, far: 60 }}
      gl={{
        antialias: !swGl,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <PlantSceneContent activeBay={activeBay} onSelectBay={onSelectBay} swGl={swGl} />
    </Canvas>
  );
};

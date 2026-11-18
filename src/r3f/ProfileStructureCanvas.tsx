import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { PageId } from '../data/siteContent';
import { createProceduralTextures } from '../three/proceduralTextures';
import { buildProfileAssembly, ProfileAssemblyResult } from '../three/profileExtrusions';

export type CameraPresetMode = 'isometric' | 'section' | 'span';

export interface ProfileStructureState {
  productId: PageId;
  explodeLocked: boolean;
  xrayMode: boolean;
  autoRotate: boolean;
  cameraPreset: CameraPresetMode;
}

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

const CAMERA_PRESETS: Record<CameraPresetMode, [number, number, number]> = {
  isometric: [2.55, 1.55, 3.85],
  section: [0.12, 0.24, 4.35],
  span: [3.85, 0.92, 1.55],
};

const _targetCamVec = new THREE.Vector3();

interface SceneContentProps {
  state: ProfileStructureState;
  hovered: boolean;
  swGl: boolean;
}

const ProfileSceneContent: React.FC<SceneContentProps> = ({ state, hovered, swGl }) => {
  const { gl, camera, invalidate } = useThree();
  const pivotRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const explodeRef = useRef(0);
  const camTransitioningRef = useRef(false);
  const prevPresetRef = useRef<CameraPresetMode>(state.cameraPreset);

  const textures = useMemo(() => {
    return createProceduralTextures(gl.capabilities.getMaxAnisotropy());
  }, [gl]);

  const assembly = useMemo<ProfileAssemblyResult>(() => {
    return buildProfileAssembly(state.productId, textures);
  }, [state.productId, textures]);

  useEffect(() => {
    assembly.setXRayMode(state.xrayMode);
    invalidate();
  }, [assembly, state.xrayMode, invalidate]);

  useEffect(() => {
    return () => {
      assembly.dispose();
    };
  }, [assembly]);

  useEffect(() => {
    return () => {
      textures.dispose();
    };
  }, [textures]);

  useEffect(() => {
    if (prevPresetRef.current !== state.cameraPreset) {
      prevPresetRef.current = state.cameraPreset;
      camTransitioningRef.current = true;
      invalidate();
    }
  }, [state.cameraPreset, invalidate]);

  // Software-WebGL demand pacing when animations are active
  useEffect(() => {
    if (!swGl) return;
    let alive = true;
    const timer = window.setInterval(() => {
      if (alive) invalidate();
    }, 90);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [swGl, invalidate]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.08);
    const targetExplode = hovered || state.explodeLocked ? 1 : 0;
    explodeRef.current = THREE.MathUtils.damp(explodeRef.current, targetExplode, 6.5, dt);
    assembly.updateExplode(explodeRef.current);

    if (pivotRef.current && state.autoRotate && !hovered) {
      pivotRef.current.rotation.y += dt * 0.42;
    }

    if (camTransitioningRef.current) {
      const coords = CAMERA_PRESETS[state.cameraPreset];
      _targetCamVec.set(coords[0], coords[1], coords[2]);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamVec.x, 5.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamVec.y, 5.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamVec.z, 5.5, dt);
      if (camera.position.distanceTo(_targetCamVec) < 0.025) {
        camera.position.copy(_targetCamVec);
        camTransitioningRef.current = false;
      }
      controlsRef.current?.update();
    }
  });

  return (
    <>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[-4, 3, 4]} scale={[6, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[4, 5, 2]} scale={[5, 5, 1]} color="#fff7ed" />
        <Lightformer form="ring" intensity={1.1} position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#e2e8f0" />
      </Environment>

      <hemisphereLight args={['#eef4ff', '#94a3b8', 0.9]} />
      <directionalLight position={[4, 6, 5]} intensity={2.25} color="#fff5e8" castShadow={!swGl} />
      <directionalLight position={[-4, 2.5, -3]} intensity={1.35} color="#ffffff" />

      <group ref={pivotRef}>
        <primitive object={assembly.group} />
      </group>

      {!swGl && (
        <ContactShadows
          position={[0, -0.96, 0]}
          opacity={0.32}
          scale={6.5}
          blur={2.2}
          far={3}
          resolution={256}
          color="#0f172a"
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping={!swGl}
        dampingFactor={0.06}
        target={[0, 0, 0]}
        onStart={() => {
          camTransitioningRef.current = false;
        }}
        onChange={() => {
          if (swGl) invalidate();
        }}
      />
    </>
  );
};

interface ProfileStructureCanvasProps {
  state: ProfileStructureState;
}

export const ProfileStructureCanvas: React.FC<ProfileStructureCanvasProps> = ({ state }) => {
  const [hovered, setHovered] = useState(false);
  const swGl = useMemo(() => detectSoftwareWebGL(), []);

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas
        dpr={swGl ? 1 : [1, 2]}
        frameloop={swGl ? 'demand' : 'always'}
        camera={{ position: CAMERA_PRESETS.isometric, fov: 34, near: 0.1, far: 40 }}
        gl={{
          antialias: !swGl,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <ProfileSceneContent state={state} hovered={hovered} swGl={swGl} />
      </Canvas>
    </div>
  );
};

import * as THREE from 'three';
import { PageId } from '../data/siteContent';
import { ProceduralTextureSet } from './proceduralTextures';

export interface ProfileAssemblyResult {
  group: THREE.Group;
  updateExplode: (explodeProgress: number) => void;
  setXRayMode: (enabled: boolean) => void;
  dispose: () => void;
}

/**
 * Creates a smooth-cornered extruded mesh mimicking genuine cold roll-formed
 * galvanized sheet bending radii (no sharp primitive blocks).
 */
function createExtrudedProfileMesh(
  shape: THREE.Shape,
  depth: number,
  material: THREE.Material,
  bevelSize = 0.009
): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.center();
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Cold roll-formed open return-lip GI C-channel with rounded external bend radii
 */
function makeColdRolledCChannelShape(w: number, h: number, t: number, lip: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(t * 1.4, 0.055);

  // Outer perimeter clockwise starting bottom-right lip tip
  s.moveTo(hw, -hh + lip);
  s.lineTo(hw, -hh + r);
  s.quadraticCurveTo(hw, -hh, hw - r, -hh);
  s.lineTo(-hw + r, -hh);
  s.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
  s.lineTo(-hw, hh - r);
  s.quadraticCurveTo(-hw, hh, -hw + r, hh);
  s.lineTo(hw - r, hh);
  s.quadraticCurveTo(hw, hh, hw, hh - r);
  s.lineTo(hw, hh - lip);

  // Inner wall back counter-clockwise
  s.lineTo(hw - t, hh - lip);
  s.lineTo(hw - t, hh - t);
  s.lineTo(-hw + t, hh - t);
  s.lineTo(-hw + t, -hh + t);
  s.lineTo(hw - t, -hh + t);
  s.lineTo(hw - t, -hh + lip);
  s.closePath();
  return s;
}

/**
 * Cold roll-formed GI U-Channel with smooth formed base corners
 */
function makeColdRolledUChannelShape(w: number, h: number, t: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(t * 1.45, 0.055);

  s.moveTo(hw, hh);
  s.lineTo(hw, -hh + r);
  s.quadraticCurveTo(hw, -hh, hw - r, -hh);
  s.lineTo(-hw + r, -hh);
  s.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
  s.lineTo(-hw, hh);
  s.lineTo(-hw + t, hh);
  s.lineTo(-hw + t, -hh + t);
  s.lineTo(hw - t, -hh + t);
  s.lineTo(hw - t, hh);
  s.closePath();
  return s;
}

/**
 * Heavy-gauge closed rectangular/square steel box section with rounded roll-formed corners
 */
function makeColdRolledClosedBoxShape(w: number, h: number, t: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(t * 1.35, 0.065);

  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  s.closePath();

  const ir = Math.max(0.015, r * 0.55);
  const ihw = hw - t;
  const ihh = hh - t;
  const hole = new THREE.Path();
  hole.moveTo(-ihw + ir, -ihh);
  hole.lineTo(ihw - ir, -ihh);
  hole.quadraticCurveTo(ihw, -ihh, ihw, -ihh + ir);
  hole.lineTo(ihw, ihh - ir);
  hole.quadraticCurveTo(ihw, ihh, ihw - ir, ihh);
  hole.lineTo(-ihw + ir, ihh);
  hole.quadraticCurveTo(-ihw, ihh, -ihw, ihh - ir);
  hole.lineTo(-ihw, -ihh + ir);
  hole.quadraticCurveTo(-ihw, -ihh, -ihw + ir, -ihh);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

/**
 * Cold roll-formed GI L-Angle / Auxiliary Corner Stiffener
 */
function makeColdRolledLAngleShape(w: number, h: number, t: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(t * 1.4, 0.05);

  s.moveTo(-hw + r, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw, -hh + t);
  s.lineTo(-hw + t, -hh + t);
  s.lineTo(-hw + t, hh);
  s.lineTo(-hw, hh);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  s.closePath();
  return s;
}

/**
 * Realistic multi-chamber cutaway uPVC outer frame profile showing steel core chamber + drainage web
 */
function makeMultiChamberUpvcShape(w: number, h: number, wall: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;

  // Outer stepped uPVC profile contour with glazing rebate shoulder
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw, hh * 0.42);
  s.lineTo(hw * 0.52, hh * 0.42);
  s.lineTo(hw * 0.52, hh);
  s.lineTo(-hw, hh);
  s.closePath();

  // Central steel reinforcement chamber cavity
  const chamber = new THREE.Path();
  chamber.moveTo(-hw + wall, -hh + wall);
  chamber.lineTo(-hw + wall, hh - wall);
  chamber.lineTo(hw * 0.52 - wall, hh - wall);
  chamber.lineTo(hw * 0.52 - wall, -hh + wall);
  chamber.closePath();
  s.holes.push(chamber);

  // Secondary front thermal drainage chamber
  const thermal = new THREE.Path();
  thermal.moveTo(hw * 0.52, -hh + wall);
  thermal.lineTo(hw - wall, -hh + wall);
  thermal.lineTo(hw - wall, hh * 0.42 - wall);
  thermal.lineTo(hw * 0.52, hh * 0.42 - wall);
  thermal.closePath();
  s.holes.push(thermal);

  return s;
}

/**
 * Builds an authentic composite 3D steel reinforcement section model
 * tailored to each verified MK Reinforcement product category.
 */
export function buildProfileAssembly(
  productId: PageId,
  textures: ProceduralTextureSet
): ProfileAssemblyResult {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const steelMat = new THREE.MeshStandardMaterial({
    map: textures.galvanizedColor,
    roughnessMap: textures.galvanizedRoughness,
    bumpMap: textures.galvanizedBump,
    bumpScale: 0.009,
    metalness: 0.91,
    roughness: 0.25,
  });

  const secondarySteelMat = new THREE.MeshStandardMaterial({
    map: textures.galvanizedColor,
    roughnessMap: textures.galvanizedRoughness,
    color: new THREE.Color('#b6c0cc'),
    metalness: 0.93,
    roughness: 0.22,
  });

  const upvcMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f4f6f9'),
    roughnessMap: textures.upvcRoughness,
    metalness: 0.02,
    roughness: 0.34,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
    transparent: true,
    opacity: 0.92,
  });

  const gasketMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e293b'),
    metalness: 0.04,
    roughness: 0.85,
  });

  const hardwareDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#334155'),
    metalness: 0.85,
    roughness: 0.28,
  });

  const accentSeamMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C8102E'),
    metalness: 0.3,
    roughness: 0.4,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cbd5e1'),
    metalness: 0.95,
    roughness: 0.18,
  });

  materials.push(
    steelMat,
    secondarySteelMat,
    upvcMat,
    gasketMat,
    hardwareDarkMat,
    accentSeamMat,
    screwMat
  );

  const animatedParts: { obj: THREE.Object3D; basePos: THREE.Vector3; deltaPos: THREE.Vector3 }[] = [];

  if (productId === 'product-door') {
    // 2. uPVC Door Steel Reinforcement (1.5mm - 2.5mm Closed Box + Heavy Multi-Chamber Sash + 3D Hinge)
    const closedBoxCore = createExtrudedProfileMesh(
      makeColdRolledClosedBoxShape(0.84, 1.02, 0.095),
      2.65,
      steelMat,
      0.012
    );
    closedBoxCore.position.set(-0.14, 0, 0);

    // Cold-rolled lock-seam line visible on the box face
    const seamStrip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 2.66), secondarySteelMat);
    seamStrip.position.set(-0.14, 0.51, 0);

    const doorUpvcProfile = createExtrudedProfileMesh(
      makeMultiChamberUpvcShape(1.42, 1.32, 0.085),
      1.55,
      upvcMat,
      0.01
    );
    doorUpvcProfile.position.set(0.05, 0, -0.45);

    // EPDM weather-seal gasket strip along rebate
    const gasketStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 1.56), gasketMat);
    gasketStrip.position.set(0.56, 0.28, -0.45);

    // Heavy 3D Door Hinge Anchored to Steel Core
    const hingePlate = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.62, 0.32), hardwareDarkMat);
    hingePlate.position.set(0.76, 0.08, 0.24);
    const hingeBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.58, 18), secondarySteelMat);
    hingeBarrel.position.set(0.85, 0.08, 0.24);

    // 4 self-drilling heavy door anchor screws
    const screwGeo = new THREE.CylinderGeometry(0.032, 0.016, 0.34, 12);
    const screws = new THREE.InstancedMesh(screwGeo, screwMat, 4);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 4; i++) {
      dummy.position.set(-0.14, 0.66, -0.75 + i * 0.5);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      screws.setMatrixAt(i, dummy.matrix);
    }
    screws.computeBoundingSphere();

    geometries.push(
      closedBoxCore.geometry,
      seamStrip.geometry,
      doorUpvcProfile.geometry,
      gasketStrip.geometry,
      hingePlate.geometry,
      hingeBarrel.geometry,
      screwGeo
    );

    group.add(
      closedBoxCore,
      seamStrip,
      doorUpvcProfile,
      gasketStrip,
      hingePlate,
      hingeBarrel,
      screws
    );

    animatedParts.push(
      { obj: closedBoxCore, basePos: closedBoxCore.position.clone(), deltaPos: new THREE.Vector3(0, 0, 0.42) },
      { obj: seamStrip, basePos: seamStrip.position.clone(), deltaPos: new THREE.Vector3(0, 0, 0.42) },
      { obj: doorUpvcProfile, basePos: doorUpvcProfile.position.clone(), deltaPos: new THREE.Vector3(0, 0, -0.42) },
      { obj: gasketStrip, basePos: gasketStrip.position.clone(), deltaPos: new THREE.Vector3(0.18, 0.12, -0.42) },
      { obj: hingePlate, basePos: hingePlate.position.clone(), deltaPos: new THREE.Vector3(0.36, 0, 0) },
      { obj: hingeBarrel, basePos: hingeBarrel.position.clone(), deltaPos: new THREE.Vector3(0.42, 0, 0) },
      { obj: screws, basePos: screws.position.clone(), deltaPos: new THREE.Vector3(0, 0.34, 0.2) }
    );
  } else if (productId === 'product-channels') {
    // 3. Pure Galvanized Iron (GI) U, C & L Channels (zero uPVC sleeve — pure cold roll-formed structural iron)
    const cChannel = createExtrudedProfileMesh(
      makeColdRolledCChannelShape(0.68, 0.84, 0.072, 0.18),
      2.6,
      steelMat,
      0.01
    );
    cChannel.position.set(-0.78, 0.06, 0);

    const uChannel = createExtrudedProfileMesh(
      makeColdRolledUChannelShape(0.62, 0.68, 0.068),
      2.6,
      secondarySteelMat,
      0.01
    );
    uChannel.position.set(0.06, -0.08, 0);

    const lChannel = createExtrudedProfileMesh(
      makeColdRolledLAngleShape(0.56, 0.56, 0.068),
      2.6,
      steelMat,
      0.01
    );
    lChannel.position.set(0.84, -0.06, 0);

    // Inline punched oblong hardware slots along the C-channel web
    const slotGeo = new THREE.BoxGeometry(0.036, 0.18, 0.085);
    const slotInstances = new THREE.InstancedMesh(slotGeo, accentSeamMat, 5);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 5; i++) {
      dummy.position.set(-1.12, 0.06, -0.9 + i * 0.45);
      dummy.updateMatrix();
      slotInstances.setMatrixAt(i, dummy.matrix);
    }
    slotInstances.computeBoundingSphere();

    geometries.push(cChannel.geometry, uChannel.geometry, lChannel.geometry, slotGeo);
    group.add(cChannel, uChannel, lChannel, slotInstances);

    animatedParts.push(
      { obj: cChannel, basePos: cChannel.position.clone(), deltaPos: new THREE.Vector3(-0.28, 0.12, 0.15) },
      { obj: slotInstances, basePos: slotInstances.position.clone(), deltaPos: new THREE.Vector3(-0.28, 0.12, 0.15) },
      { obj: uChannel, basePos: uChannel.position.clone(), deltaPos: new THREE.Vector3(0, -0.14, 0) },
      { obj: lChannel, basePos: lChannel.position.clone(), deltaPos: new THREE.Vector3(0.28, 0.12, -0.15) }
    );
  } else if (productId === 'product-heavy-sash') {
    // 4. Heavy-Duty Door Sash Steel Reinforcement (2.0mm - 3.0mm Thick-Gauge Closed Box + Internal Rib + Cleat)
    const heavyBox = createExtrudedProfileMesh(
      makeColdRolledClosedBoxShape(1.06, 1.18, 0.135),
      2.7,
      steelMat,
      0.015
    );

    // Internal longitudinal stiffening web for extreme wind-load & patio glass weight resistance
    const internalRib = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.92, 2.66), secondarySteelMat);
    internalRib.castShadow = true;

    // Corner welding cleat & locking bolt assembly for lift-and-slide portals
    const cornerCleat = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.24, 0.34), hardwareDarkMat);
    cornerCleat.position.set(0, 0.64, 0.85);

    const boltGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.18, 6);
    const bolts = new THREE.InstancedMesh(boltGeo, screwMat, 4);
    const dummy = new THREE.Object3D();
    const boltOffsets = [
      [-0.36, 0.78, 0.85],
      [0.36, 0.78, 0.85],
      [-0.36, 0.78, -0.55],
      [0.36, 0.78, -0.55],
    ];
    boltOffsets.forEach(([bx, by, bz], idx) => {
      dummy.position.set(bx, by, bz);
      dummy.updateMatrix();
      bolts.setMatrixAt(idx, dummy.matrix);
    });
    bolts.computeBoundingSphere();

    geometries.push(heavyBox.geometry, internalRib.geometry, cornerCleat.geometry, boltGeo);
    group.add(heavyBox, internalRib, cornerCleat, bolts);

    animatedParts.push(
      { obj: heavyBox, basePos: heavyBox.position.clone(), deltaPos: new THREE.Vector3(0, 0, 0.26) },
      { obj: internalRib, basePos: internalRib.position.clone(), deltaPos: new THREE.Vector3(0, 0.36, -0.3) },
      { obj: cornerCleat, basePos: cornerCleat.position.clone(), deltaPos: new THREE.Vector3(0, 0.45, 0.22) },
      { obj: bolts, basePos: bolts.position.clone(), deltaPos: new THREE.Vector3(0, 0.58, 0.15) }
    );
  } else {
    // 1. uPVC Window Steel Reinforcement (1.0mm - 2.0mm Cold-Rolled C-Channel inside Multi-Chamber uPVC Frame)
    const cChannelCore = createExtrudedProfileMesh(
      makeColdRolledCChannelShape(0.68, 0.84, 0.072, 0.17),
      2.6,
      steelMat,
      0.01
    );
    cChannelCore.position.set(-0.14, 0, 0);

    const windowUpvcFrame = createExtrudedProfileMesh(
      makeMultiChamberUpvcShape(1.24, 1.14, 0.082),
      1.5,
      upvcMat,
      0.01
    );
    windowUpvcFrame.position.set(0.04, 0, -0.45);

    const epdmSeal = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 1.51), gasketMat);
    epdmSeal.position.set(0.46, 0.24, -0.45);

    // Self-tapping window hardware screws biting into steel core
    const screwGeo = new THREE.CylinderGeometry(0.028, 0.015, 0.28, 12);
    const screwCount = 6;
    const screws = new THREE.InstancedMesh(screwGeo, screwMat, screwCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < screwCount; i++) {
      dummy.position.set(-0.14, 0.56, -0.9 + i * 0.36);
      dummy.updateMatrix();
      screws.setMatrixAt(i, dummy.matrix);
    }
    screws.computeBoundingSphere();

    geometries.push(cChannelCore.geometry, windowUpvcFrame.geometry, epdmSeal.geometry, screwGeo);
    group.add(cChannelCore, windowUpvcFrame, epdmSeal, screws);

    animatedParts.push(
      { obj: cChannelCore, basePos: cChannelCore.position.clone(), deltaPos: new THREE.Vector3(0, 0, 0.42) },
      { obj: windowUpvcFrame, basePos: windowUpvcFrame.position.clone(), deltaPos: new THREE.Vector3(0, 0, -0.42) },
      { obj: epdmSeal, basePos: epdmSeal.position.clone(), deltaPos: new THREE.Vector3(0.16, 0.12, -0.42) },
      { obj: screws, basePos: screws.position.clone(), deltaPos: new THREE.Vector3(0, 0.34, 0.16) }
    );
  }

  group.rotation.set(0.28, -0.58, 0.08);

  return {
    group,
    updateExplode: (explodeProgress: number) => {
      for (const item of animatedParts) {
        item.obj.position.copy(item.basePos).addScaledVector(item.deltaPos, explodeProgress);
      }
    },
    setXRayMode: (enabled: boolean) => {
      upvcMat.opacity = enabled ? 0.28 : 0.92;
      upvcMat.depthWrite = !enabled;
      upvcMat.needsUpdate = true;
      gasketMat.transparent = enabled;
      gasketMat.opacity = enabled ? 0.45 : 1;
      gasketMat.needsUpdate = true;
    },
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
    },
  };
}

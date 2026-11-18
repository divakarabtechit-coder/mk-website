import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';

export interface PartInspectionInfo {
  id: string;
  name: string;
  spec: string;
}

export interface TrackedPartAnchor {
  info: PartInspectionInfo;
  anchor: THREE.Object3D;
}

export interface WindowAssemblyController {
  root: THREE.Group;
  interactables: THREE.Object3D[];
  partAnchors: TrackedPartAnchor[];
  applyExplode: (amount: number) => void;
  setHighlightPart: (partId: string | null) => void;
  dispose: () => void;
}

interface ExplodableLayer {
  group: THREE.Group;
  basePos: THREE.Vector3;
  explodeDelta: THREE.Vector3;
}

const PART_DETAILS: Record<string, PartInspectionInfo> = {
  steel_c_channel: {
    id: 'steel_c_channel',
    name: 'GI C-Channel Frame Core',
    spec: 'Hot-Dip Galvanized · 1.5mm – 2.0mm · Return-Lip Stiffener',
  },
  steel_box_mullion: {
    id: 'steel_box_mullion',
    name: 'Closed Box Mullion Section',
    spec: 'Heavy-Duty 2.0mm – 3.0mm · Multi-Axis Wind-Load Resistance',
  },
  steel_sash_u: {
    id: 'steel_sash_u',
    name: 'Sash U-Channel Steel Core',
    spec: 'Cold Roll-Formed GI · Inline Punched Hardware Anchoring',
  },
  upvc_outer_frame: {
    id: 'upvc_outer_frame',
    name: 'Multi-Chamber uPVC Frame',
    spec: 'Cutaway Outer Profile · Precision 0.2mm Core Fitment',
  },
  upvc_sash_front: {
    id: 'upvc_sash_front',
    name: 'Beveled Mitered Sliding Sash',
    spec: '45° Fusion-Welded uPVC Sash with Glazing Bead',
  },
  igu_glass: {
    id: 'igu_glass',
    name: 'Double-Glazed Insulated Unit',
    spec: 'Dual Low-E Glass + Anodized Warm-Edge Spacer Frame',
  },
  epdm_gasket: {
    id: 'epdm_gasket',
    name: 'EPDM Weather-Seal Gaskets',
    spec: 'Acoustic & Coastal Moisture Barrier Seals',
  },
};

/**
 * Helper to create a 2D extruded C-channel or U-channel steel cross-section along an axis.
 */
function createChannelGeometry(
  length: number,
  width: number,
  depth: number,
  thickness: number,
  returnLip: number
): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const t = thickness;
  const r = Math.min(t * 1.4, 0.022);

  const shape = new THREE.Shape();
  if (returnLip > 0) {
    // Cold roll-formed GI C-Channel with rounded outer bend radii & inward return lips
    shape.moveTo(-hw + returnLip, hd);
    shape.lineTo(hw - r, hd);
    shape.quadraticCurveTo(hw, hd, hw, hd - r);
    shape.lineTo(hw, -hd + r);
    shape.quadraticCurveTo(hw, -hd, hw - r, -hd);
    shape.lineTo(-hw + returnLip, -hd);
    shape.lineTo(-hw + returnLip, -hd + t);
    shape.lineTo(hw - t, -hd + t);
    shape.lineTo(hw - t, hd - t);
    shape.lineTo(-hw + returnLip, hd - t);
    shape.closePath();
  } else {
    // Cold roll-formed Open GI U-Channel with rounded base bends
    shape.moveTo(-hw, hd);
    shape.lineTo(hw - r, hd);
    shape.quadraticCurveTo(hw, hd, hw, hd - r);
    shape.lineTo(hw, -hd + r);
    shape.quadraticCurveTo(hw, -hd, hw - r, -hd);
    shape.lineTo(-hw, -hd);
    shape.lineTo(-hw, -hd + t);
    shape.lineTo(hw - t, -hd + t);
    shape.lineTo(hw - t, hd - t);
    shape.lineTo(-hw, hd - t);
    shape.closePath();
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 10,
    steps: 1,
  });
  geo.center();
  return geo;
}

/**
 * Helper to create a hollow rectangular Closed Box steel section with rounded roll-formed corners.
 */
function createClosedBoxGeometry(
  length: number,
  width: number,
  depth: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const t = thickness;
  const r = Math.min(t * 1.4, 0.022);

  const outer = new THREE.Shape();
  outer.moveTo(-hw + r, -hd);
  outer.lineTo(hw - r, -hd);
  outer.quadraticCurveTo(hw, -hd, hw, -hd + r);
  outer.lineTo(hw, hd - r);
  outer.quadraticCurveTo(hw, hd, hw - r, hd);
  outer.lineTo(-hw + r, hd);
  outer.quadraticCurveTo(-hw, hd, -hw, hd - r);
  outer.lineTo(-hw, -hd + r);
  outer.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  outer.closePath();

  const ir = Math.max(0.006, r * 0.5);
  const ihw = hw - t;
  const ihh = hd - t;
  const inner = new THREE.Path();
  inner.moveTo(-ihw + ir, -ihh);
  inner.lineTo(ihw - ir, -ihh);
  inner.quadraticCurveTo(ihw, -ihh, ihw, -ihh + ir);
  inner.lineTo(ihw, ihh - ir);
  inner.quadraticCurveTo(ihw, ihh, ihw - ir, ihh);
  inner.lineTo(-ihw + ir, ihh);
  inner.quadraticCurveTo(-ihw, ihh, -ihw, ihh - ir);
  inner.lineTo(-ihw, -ihh + ir);
  inner.quadraticCurveTo(-ihw, -ihh, -ihw + ir, -ihh);
  inner.closePath();

  outer.holes.push(inner);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: length,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 10,
    steps: 1,
  });
  geo.center();
  return geo;
}

/**
 * Creates a mitered rectangular picture-frame perimeter (4 beveled bars).
 */
function createBeveledFrameGroup(
  outerW: number,
  outerH: number,
  barWidth: number,
  barDepth: number,
  material: THREE.Material,
  partInfo: PartInspectionInfo,
  skipLeftWall = false
): { group: THREE.Group; geometries: THREE.BufferGeometry[] } {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];

  const makeBar = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.014,
      bevelSegments: 3,
      steps: 1,
    });
    geo.center();
    geometries.push(geo);

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.partInfo = partInfo;
    mesh.layers.enable(1);
    group.add(mesh);
  };

  // Top & Bottom bars
  makeBar(outerW - 0.02, barWidth, barDepth, 0, outerH / 2 - barWidth / 2, 0);
  makeBar(outerW - 0.02, barWidth, barDepth, 0, -outerH / 2 + barWidth / 2, 0);
  // Right bar
  makeBar(barWidth, outerH - barWidth * 2 + 0.02, barDepth, outerW / 2 - barWidth / 2, 0, 0);

  if (!skipLeftWall) {
    makeBar(barWidth, outerH - barWidth * 2 + 0.02, barDepth, -outerW / 2 + barWidth / 2, 0, 0);
  } else {
    // Cutaway left jamb: twin thin front & rear uPVC outer walls exposing the steel core inside
    const wallThick = 0.024;
    const wallDepth = barDepth * 0.28;
    makeBar(
      wallThick,
      outerH - 0.04,
      wallDepth,
      -outerW / 2 + wallThick / 2,
      0,
      barDepth * 0.36
    );
    makeBar(
      wallThick,
      outerH - 0.04,
      wallDepth,
      -outerW / 2 + wallThick / 2,
      0,
      -barDepth * 0.36
    );
    // Inner chamber divider rib
    makeBar(
      0.018,
      outerH - 0.06,
      barDepth * 0.72,
      -outerW / 2 + barWidth - 0.015,
      0,
      0
    );
  }

  return { group, geometries };
}

export function buildWindowAssembly(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): WindowAssemblyController {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const interactables: THREE.Object3D[] = [];
  const explodableLayers: ExplodableLayer[] = [];
  const highlightMeshes: { mesh: THREE.Mesh; partId: string; baseEmissive: number }[] = [];

  // Overall window dimensions (scaled cleanly for studio camera)
  const W = 3.25;
  const H = 2.68;

  // --- Calibrated PBR Materials ---
  const upvcMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f6f9,
    roughness: 0.28,
    roughnessMap: textures.upvcRoughness,
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
  });
  materials.push(upvcMat);

  const upvcInnerMat = new THREE.MeshStandardMaterial({
    color: 0xe3e7ed,
    roughness: 0.42,
    metalness: 0.04,
  });
  materials.push(upvcInnerMat);

  // Hero Material: Hot-Dip Galvanized Cold-Rolled Steel
  const steelMat = new THREE.MeshPhysicalMaterial({
    color: 0xd5dce3,
    map: textures.galvanizedColor,
    roughnessMap: textures.galvanizedRoughness,
    bumpMap: textures.galvanizedBump,
    bumpScale: 0.004,
    metalness: 0.92,
    roughness: 0.24,
    anisotropy: 0.72,
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0.15,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.35,
  });
  materials.push(steelMat);

  const steelDarkMat = new THREE.MeshPhysicalMaterial({
    color: 0x9aa4b0,
    map: textures.galvanizedColor,
    metalness: 0.94,
    roughness: 0.28,
    envMapIntensity: 1.25,
  });
  materials.push(steelDarkMat);

  const gasketMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.86,
    metalness: 0.04,
  });
  materials.push(gasketMat);

  const spacerMat = new THREE.MeshStandardMaterial({
    color: 0x6ea8bc,
    metalness: 0.78,
    roughness: 0.26,
    envMapIntensity: 1.2,
  });
  materials.push(spacerMat);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd6efff,
    metalness: 0.05,
    roughness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.78,
    transparent: true,
    opacity: isSoftwareGl ? 0.42 : 0.92,
    ior: 1.52,
    thickness: 0.18,
    attenuationColor: new THREE.Color(0x9bd3f2),
    attenuationDistance: 1.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.5,
    depthWrite: false,
  });
  materials.push(glassMat);

  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0x262930,
    metalness: 0.55,
    roughness: 0.35,
  });
  materials.push(hardwareMat);

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0xc2cbd4,
    metalness: 0.95,
    roughness: 0.2,
  });
  materials.push(screwMat);

  const registerHighlightable = (group: THREE.Object3D, partId: string) => {
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.layers.enable(1);
        interactables.push(mesh);
        // Clone material only if we need per-part emissive highlighting cleanly without affecting shared siblings
        const cloned = (mesh.material as THREE.Material).clone();
        materials.push(cloned);
        mesh.material = cloned;
        highlightMeshes.push({
          mesh,
          partId,
          baseEmissive: 0x000000,
        });
      }
    });
  };

  // =========================================================================
  // LAYER 1: Outer Multi-Chamber uPVC Frame (with left cutaway jamb)
  // =========================================================================
  const outerFrameLayer = new THREE.Group();
  const outerBuilt = createBeveledFrameGroup(
    W,
    H,
    0.2,
    0.46,
    upvcMat,
    PART_DETAILS.upvc_outer_frame,
    true
  );
  outerFrameLayer.add(outerBuilt.group);
  geometries.push(...outerBuilt.geometries);

  // Central Mullion outer uPVC housing
  const mullionUpvcGeo = new THREE.BoxGeometry(0.14, H - 0.36, 0.42);
  geometries.push(mullionUpvcGeo);
  const mullionUpvc = new THREE.Mesh(mullionUpvcGeo, upvcMat);
  mullionUpvc.castShadow = true;
  mullionUpvc.receiveShadow = true;
  mullionUpvc.userData.partInfo = PART_DETAILS.upvc_outer_frame;
  outerFrameLayer.add(mullionUpvc);

  // Recessed interior dark shadow pocket for cutaway depth (mirrors reference image!)
  const pocketGeo = new THREE.BoxGeometry(0.11, H - 0.1, 0.32);
  geometries.push(pocketGeo);
  const pocketMesh = new THREE.Mesh(pocketGeo, upvcInnerMat);
  pocketMesh.position.set(-W / 2 + 0.085, 0, 0);
  pocketMesh.userData.partInfo = PART_DETAILS.upvc_outer_frame;
  outerFrameLayer.add(pocketMesh);

  registerHighlightable(outerFrameLayer, 'upvc_outer_frame');
  root.add(outerFrameLayer);
  explodableLayers.push({
    group: outerFrameLayer,
    basePos: new THREE.Vector3(0, 0, -0.02),
    explodeDelta: new THREE.Vector3(0, 0, -0.34),
  });

  // =========================================================================
  // LAYER 2: EPDM Weather-Seal Gaskets
  // =========================================================================
  const gasketLayer = new THREE.Group();
  const leftGasket = createBeveledFrameGroup(
    1.36,
    H - 0.42,
    0.036,
    0.16,
    gasketMat,
    PART_DETAILS.epdm_gasket,
    false
  );
  leftGasket.group.position.set(-0.74, 0, 0.03);
  geometries.push(...leftGasket.geometries);
  gasketLayer.add(leftGasket.group);

  const rightGasket = createBeveledFrameGroup(
    1.36,
    H - 0.42,
    0.036,
    0.16,
    gasketMat,
    PART_DETAILS.epdm_gasket,
    false
  );
  rightGasket.group.position.set(0.74, 0, 0.03);
  geometries.push(...rightGasket.geometries);
  gasketLayer.add(rightGasket.group);

  // Left cutaway vertical gasket tracks (sharp black lines visible at left jamb)
  const trackGasketGeo = new THREE.BoxGeometry(0.022, H - 0.08, 0.045);
  geometries.push(trackGasketGeo);
  const g1 = new THREE.Mesh(trackGasketGeo, gasketMat);
  g1.position.set(-W / 2 + 0.045, 0, 0.14);
  g1.userData.partInfo = PART_DETAILS.epdm_gasket;
  gasketLayer.add(g1);

  const g2 = new THREE.Mesh(trackGasketGeo, gasketMat);
  g2.position.set(-W / 2 + 0.045, 0, -0.14);
  g2.userData.partInfo = PART_DETAILS.epdm_gasket;
  gasketLayer.add(g2);

  registerHighlightable(gasketLayer, 'epdm_gasket');
  root.add(gasketLayer);
  explodableLayers.push({
    group: gasketLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 0.06),
  });

  // =========================================================================
  // LAYER 3: MK GALVANIZED STEEL FRAME REINFORCEMENT (C-Channels + Box Mullion)
  // =========================================================================
  // Left Jamb GI C-Channel (Visibly nestled in the cutaway chamber, glides out on hover!)
  const leftSteelCGroup = new THREE.Group();
  const leftCGeo = createChannelGeometry(H - 0.14, 0.125, 0.24, 0.018, 0.028);
  leftCGeo.rotateX(Math.PI / 2);
  geometries.push(leftCGeo);
  const leftCMesh = new THREE.Mesh(leftCGeo, steelMat);
  leftCMesh.position.set(-W / 2 + 0.105, 0, 0);
  leftCMesh.castShadow = true;
  leftCMesh.receiveShadow = true;
  leftCMesh.userData.partInfo = PART_DETAILS.steel_c_channel;
  leftSteelCGroup.add(leftCMesh);

  // Subtle steel edge highlight lines on the C-Channel so roll-formed bends look razor crisp
  const leftCEdges = new THREE.EdgesGeometry(leftCGeo, 28);
  geometries.push(leftCEdges);
  const edgeLineMat = new THREE.LineBasicMaterial({
    color: 0x475569,
    transparent: true,
    opacity: 0.45,
  });
  materials.push(edgeLineMat);
  const leftCLines = new THREE.LineSegments(leftCEdges, edgeLineMat);
  leftCLines.position.copy(leftCMesh.position);
  leftSteelCGroup.add(leftCLines);

  // Instanced self-tapping hardware screws along the C-channel flange
  const screwGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 10);
  screwGeo.rotateZ(Math.PI / 2);
  geometries.push(screwGeo);
  const screwCount = 24;
  const screwInstanced = new THREE.InstancedMesh(screwGeo, screwMat, screwCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 12; i++) {
    const yPos = -H / 2 + 0.28 + i * ((H - 0.56) / 11);
    dummy.position.set(-W / 2 + 0.17, yPos, 0.05);
    dummy.updateMatrix();
    screwInstanced.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(-W / 2 + 0.17, yPos, -0.05);
    dummy.updateMatrix();
    screwInstanced.setMatrixAt(i * 2 + 1, dummy.matrix);
  }
  screwInstanced.instanceMatrix.needsUpdate = true;
  screwInstanced.computeBoundingSphere();
  screwInstanced.userData.partInfo = PART_DETAILS.steel_c_channel;
  leftSteelCGroup.add(screwInstanced);

  registerHighlightable(leftSteelCGroup, 'steel_c_channel');
  root.add(leftSteelCGroup);
  explodableLayers.push({
    group: leftSteelCGroup,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(-0.32, 0, 0.36),
  });

  // Right, Top & Bottom GI Frame Channels
  const perimeterSteelGroup = new THREE.Group();
  const rightCGeo = createChannelGeometry(H - 0.18, 0.125, 0.24, 0.018, 0.028);
  rightCGeo.rotateX(Math.PI / 2);
  rightCGeo.rotateY(Math.PI);
  geometries.push(rightCGeo);
  const rightCMesh = new THREE.Mesh(rightCGeo, steelMat);
  rightCMesh.position.set(W / 2 - 0.105, 0, 0);
  rightCMesh.castShadow = true;
  rightCMesh.userData.partInfo = PART_DETAILS.steel_c_channel;
  perimeterSteelGroup.add(rightCMesh);

  const horizUGeo = createChannelGeometry(W - 0.28, 0.11, 0.22, 0.016, 0);
  horizUGeo.rotateY(Math.PI / 2);
  geometries.push(horizUGeo);

  const topUMesh = new THREE.Mesh(horizUGeo, steelMat);
  topUMesh.position.set(0, H / 2 - 0.105, 0);
  topUMesh.castShadow = true;
  topUMesh.userData.partInfo = PART_DETAILS.steel_c_channel;
  perimeterSteelGroup.add(topUMesh);

  const botUMesh = new THREE.Mesh(horizUGeo, steelMat);
  botUMesh.position.set(0, -H / 2 + 0.105, 0);
  botUMesh.castShadow = true;
  botUMesh.userData.partInfo = PART_DETAILS.steel_c_channel;
  perimeterSteelGroup.add(botUMesh);

  registerHighlightable(perimeterSteelGroup, 'steel_c_channel');
  root.add(perimeterSteelGroup);
  explodableLayers.push({
    group: perimeterSteelGroup,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 0.28),
  });

  // Central Mullion Heavy-Duty Closed Box Steel Section
  const mullionSteelGroup = new THREE.Group();
  const boxGeo = createClosedBoxGeometry(H - 0.24, 0.095, 0.24, 0.018);
  boxGeo.rotateX(Math.PI / 2);
  geometries.push(boxGeo);
  const boxMesh = new THREE.Mesh(boxGeo, steelDarkMat);
  boxMesh.position.set(0, 0, 0.02);
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  boxMesh.userData.partInfo = PART_DETAILS.steel_box_mullion;
  mullionSteelGroup.add(boxMesh);

  const boxEdges = new THREE.EdgesGeometry(boxGeo, 28);
  geometries.push(boxEdges);
  const boxLines = new THREE.LineSegments(boxEdges, edgeLineMat);
  boxLines.position.copy(boxMesh.position);
  mullionSteelGroup.add(boxLines);

  registerHighlightable(mullionSteelGroup, 'steel_box_mullion');
  root.add(mullionSteelGroup);
  explodableLayers.push({
    group: mullionSteelGroup,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 0.44),
  });

  // =========================================================================
  // LAYER 4: Double-Glazed Architectural Insulated Glass Units (Left & Right)
  // =========================================================================
  const glassLayer = new THREE.Group();
  const buildIGU = (centerX: number) => {
    const igu = new THREE.Group();
    const paneW = 1.24;
    const paneH = H - 0.52;

    const paneGeo = new THREE.BoxGeometry(paneW, paneH, 0.016);
    geometries.push(paneGeo);

    const frontPane = new THREE.Mesh(paneGeo, glassMat);
    frontPane.position.set(0, 0, 0.042);
    frontPane.renderOrder = 4;
    frontPane.userData.partInfo = PART_DETAILS.igu_glass;
    igu.add(frontPane);

    const backPane = new THREE.Mesh(paneGeo, glassMat);
    backPane.position.set(0, 0, -0.042);
    backPane.renderOrder = 3;
    backPane.userData.partInfo = PART_DETAILS.igu_glass;
    igu.add(backPane);

    // Anodized Warm-Edge Aluminum Spacer Frame between panes (distinctive teal-silver edge!)
    const spacerFrame = createBeveledFrameGroup(
      paneW - 0.01,
      paneH - 0.01,
      0.032,
      0.068,
      spacerMat,
      PART_DETAILS.igu_glass,
      false
    );
    geometries.push(...spacerFrame.geometries);
    igu.add(spacerFrame.group);

    igu.position.set(centerX, 0, 0.06);
    return igu;
  };

  glassLayer.add(buildIGU(-0.74));
  glassLayer.add(buildIGU(0.74));
  registerHighlightable(glassLayer, 'igu_glass');
  root.add(glassLayer);
  explodableLayers.push({
    group: glassLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 0.62),
  });

  // =========================================================================
  // LAYER 5: MK Sash U-Channel Steel Reinforcements (Inside Sliding Sashes)
  // =========================================================================
  const sashSteelLayer = new THREE.Group();
  const buildSashSteel = (centerX: number) => {
    const sGroup = new THREE.Group();
    const vertU = createChannelGeometry(H - 0.56, 0.068, 0.11, 0.014, 0.016);
    vertU.rotateX(Math.PI / 2);
    geometries.push(vertU);

    const lMesh = new THREE.Mesh(vertU, steelMat);
    lMesh.position.set(-0.62, 0, 0);
    lMesh.castShadow = true;
    lMesh.userData.partInfo = PART_DETAILS.steel_sash_u;
    sGroup.add(lMesh);

    const rMesh = new THREE.Mesh(vertU, steelMat);
    rMesh.rotation.y = Math.PI;
    rMesh.position.set(0.62, 0, 0);
    rMesh.castShadow = true;
    rMesh.userData.partInfo = PART_DETAILS.steel_sash_u;
    sGroup.add(rMesh);

    const hU = createChannelGeometry(1.14, 0.068, 0.11, 0.014, 0.016);
    hU.rotateY(Math.PI / 2);
    geometries.push(hU);

    const tMesh = new THREE.Mesh(hU, steelMat);
    tMesh.position.set(0, (H - 0.5) / 2, 0);
    tMesh.castShadow = true;
    tMesh.userData.partInfo = PART_DETAILS.steel_sash_u;
    sGroup.add(tMesh);

    const bMesh = new THREE.Mesh(hU, steelMat);
    bMesh.position.set(0, -(H - 0.5) / 2, 0);
    bMesh.castShadow = true;
    bMesh.userData.partInfo = PART_DETAILS.steel_sash_u;
    sGroup.add(bMesh);

    sGroup.position.set(centerX, 0, 0.15);
    return sGroup;
  };

  sashSteelLayer.add(buildSashSteel(-0.74));
  sashSteelLayer.add(buildSashSteel(0.74));
  registerHighlightable(sashSteelLayer, 'steel_sash_u');
  root.add(sashSteelLayer);
  explodableLayers.push({
    group: sashSteelLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 0.88),
  });

  // =========================================================================
  // LAYER 6: Front White Beveled uPVC Sliding Sashes + Hardware
  // =========================================================================
  const leftSashLayer = new THREE.Group();
  const leftSashFrame = createBeveledFrameGroup(
    1.46,
    H - 0.34,
    0.135,
    0.15,
    upvcMat,
    PART_DETAILS.upvc_sash_front,
    false
  );
  leftSashFrame.group.position.set(-0.74, 0, 0.19);
  geometries.push(...leftSashFrame.geometries);
  leftSashLayer.add(leftSashFrame.group);

  // Subtle metallic handle latch on meeting rail
  const latchGeo = new THREE.BoxGeometry(0.032, 0.24, 0.035);
  geometries.push(latchGeo);
  const leftLatch = new THREE.Mesh(latchGeo, hardwareMat);
  leftLatch.position.set(-0.085, 0, 0.275);
  leftLatch.userData.partInfo = PART_DETAILS.upvc_sash_front;
  leftSashLayer.add(leftLatch);

  registerHighlightable(leftSashLayer, 'upvc_sash_front');
  root.add(leftSashLayer);
  explodableLayers.push({
    group: leftSashLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(-0.14, 0, 1.15),
  });

  const rightSashLayer = new THREE.Group();
  const rightSashFrame = createBeveledFrameGroup(
    1.46,
    H - 0.34,
    0.135,
    0.15,
    upvcMat,
    PART_DETAILS.upvc_sash_front,
    false
  );
  rightSashFrame.group.position.set(0.74, 0, 0.19);
  geometries.push(...rightSashFrame.geometries);
  rightSashLayer.add(rightSashFrame.group);

  const rightLatch = new THREE.Mesh(latchGeo, hardwareMat);
  rightLatch.position.set(0.085, 0, 0.275);
  rightLatch.userData.partInfo = PART_DETAILS.upvc_sash_front;
  rightSashLayer.add(rightLatch);

  registerHighlightable(rightSashLayer, 'upvc_sash_front');
  root.add(rightSashLayer);
  explodableLayers.push({
    group: rightSashLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0.14, 0, 1.15),
  });

  // =========================================================================
  // 3D Part-Tracking Anchors (move & rotate directly with each layer)
  // =========================================================================
  const makeAnchor = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    info: PartInspectionInfo
  ): TrackedPartAnchor => {
    const anchor = new THREE.Object3D();
    anchor.position.set(x, y, z);
    parent.add(anchor);
    return { info, anchor };
  };

  const partAnchors: TrackedPartAnchor[] = [
    makeAnchor(outerFrameLayer, -0.92, H / 2 - 0.1, -0.05, PART_DETAILS.upvc_outer_frame),
    makeAnchor(leftSteelCGroup, -W / 2 + 0.105, 0.12, 0.08, PART_DETAILS.steel_c_channel),
    makeAnchor(glassLayer, -0.74, -0.68, 0.08, PART_DETAILS.igu_glass),
    makeAnchor(mullionSteelGroup, 0, 0.72, 0.12, PART_DETAILS.steel_box_mullion),
    makeAnchor(sashSteelLayer, 0.74, 0.08, 0.18, PART_DETAILS.steel_sash_u),
    makeAnchor(rightSashLayer, 1.18, -0.82, 0.24, PART_DETAILS.upvc_sash_front),
  ];

  // Grounding: keep assembly centered cleanly above y = 0
  root.position.set(0, 1.44, 0);

  const applyExplode = (amount: number) => {
    const t = THREE.MathUtils.clamp(amount, 0, 1);
    for (let i = 0; i < explodableLayers.length; i++) {
      const layer = explodableLayers[i];
      layer.group.position.set(
        layer.basePos.x + layer.explodeDelta.x * t,
        layer.basePos.y + layer.explodeDelta.y * t,
        layer.basePos.z + layer.explodeDelta.z * t
      );
    }
  };

  const setHighlightPart = (partId: string | null) => {
    for (let i = 0; i < highlightMeshes.length; i++) {
      const item = highlightMeshes[i];
      const mat = item.mesh.material as THREE.MeshStandardMaterial;
      if (!mat || !('emissive' in mat)) continue;
      if (partId && item.partId === partId) {
        // Warm crimson/amber subtle inspection highlight on hovered engineering layer
        mat.emissive.setHex(item.partId.startsWith('steel') ? 0x3b0d14 : 0x1e293b);
        mat.emissiveIntensity = 0.65;
      } else {
        mat.emissive.setHex(item.baseEmissive);
        mat.emissiveIntensity = 0;
      }
    }
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    root,
    interactables,
    partAnchors,
    applyExplode,
    setHighlightPart,
    dispose,
  };
}

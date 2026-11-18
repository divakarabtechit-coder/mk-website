import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';
import {
  PartInspectionInfo,
  TrackedPartAnchor,
  WindowAssemblyController,
} from './windowAssembly';

const DOOR_PART_DETAILS: Record<string, PartInspectionInfo> = {
  door_outer_frame: {
    id: 'door_outer_frame',
    name: 'Multi-Chamber uPVC Door Frame',
    spec: 'Cutaway Outer Jamb · Heavy-Traffic Structural Profile',
  },
  door_frame_steel: {
    id: 'door_frame_steel',
    name: 'Heavy-Gauge Frame Steel Core',
    spec: 'Hot-Dip GI 1.5mm – 2.5mm · Anti-Warp Closed Box',
  },
  door_glass: {
    id: 'door_glass',
    name: 'Double-Glazed Vision Panel',
    spec: 'Dual Low-E Glass + Anodized Warm-Edge Spacer',
  },
  door_sash_steel: {
    id: 'door_sash_steel',
    name: 'Heavy-Duty Door Sash Steel',
    spec: 'Thick-Gauge 2.0mm – 3.0mm · High-Span Sash Core',
  },
  door_sash_upvc: {
    id: 'door_sash_upvc',
    name: 'Beveled uPVC Door Leaf',
    spec: '45° Welded Sash + Insulated Bottom Kick Panel',
  },
  door_hardware: {
    id: 'door_hardware',
    name: '3D Hinges & Multi-Point Lock',
    spec: 'Direct Steel-Core Fastening · Commercial Grade',
  },
};

interface ExplodableLayer {
  group: THREE.Group;
  basePos: THREE.Vector3;
  explodeDelta: THREE.Vector3;
}

function createDoorChannelGeo(
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

function createDoorClosedBoxGeo(
  length: number,
  width: number,
  depth: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const t = thickness;
  const r = Math.min(t * 1.4, 0.024);

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

function createDoorFrameBars(
  outerW: number,
  outerH: number,
  barWidth: number,
  barDepth: number,
  material: THREE.Material,
  partInfo: PartInspectionInfo,
  cutawayLeft = false
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
      bevelThickness: 0.015,
      bevelSize: 0.013,
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

  // Top Head & Low Threshold Sill
  makeBar(outerW - 0.02, barWidth, barDepth, 0, outerH / 2 - barWidth / 2, 0);
  makeBar(outerW - 0.02, barWidth * 0.65, barDepth, 0, -outerH / 2 + (barWidth * 0.65) / 2, 0);

  // Right Jamb
  makeBar(barWidth, outerH - barWidth * 1.65 + 0.02, barDepth, outerW / 2 - barWidth / 2, 0.02, 0);

  if (!cutawayLeft) {
    makeBar(barWidth, outerH - barWidth * 1.65 + 0.02, barDepth, -outerW / 2 + barWidth / 2, 0.02, 0);
  } else {
    // Cutaway left jamb exposing heavy-gauge steel frame core
    const wallThick = 0.024;
    const wallDepth = barDepth * 0.28;
    makeBar(wallThick, outerH - 0.04, wallDepth, -outerW / 2 + wallThick / 2, 0, barDepth * 0.36);
    makeBar(wallThick, outerH - 0.04, wallDepth, -outerW / 2 + wallThick / 2, 0, -barDepth * 0.36);
    makeBar(0.018, outerH - 0.06, barDepth * 0.72, -outerW / 2 + barWidth - 0.015, 0, 0);
  }

  return { group, geometries };
}

export function buildDoorAssembly(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): WindowAssemblyController {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const interactables: THREE.Object3D[] = [];
  const explodableLayers: ExplodableLayer[] = [];
  const highlightMeshes: { mesh: THREE.Mesh; partId: string; baseEmissive: number }[] = [];

  // Architectural Single Door Proportions (tall, crisp silhouette)
  const W = 2.02;
  const H = 3.04;

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

  const steelHeavyMat = new THREE.MeshPhysicalMaterial({
    color: 0xaab4c0,
    map: textures.galvanizedColor,
    roughnessMap: textures.galvanizedRoughness,
    metalness: 0.94,
    roughness: 0.25,
    envMapIntensity: 1.3,
  });
  materials.push(steelHeavyMat);

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

  const hardwareMat = new THREE.MeshPhysicalMaterial({
    color: 0x262a32,
    metalness: 0.85,
    roughness: 0.24,
    clearcoat: 0.3,
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
  // LAYER 1: Outer Multi-Chamber uPVC Door Frame (with left cutaway jamb)
  // =========================================================================
  const outerFrameLayer = new THREE.Group();
  const outerBuilt = createDoorFrameBars(
    W,
    H,
    0.2,
    0.46,
    upvcMat,
    DOOR_PART_DETAILS.door_outer_frame,
    true
  );
  outerFrameLayer.add(outerBuilt.group);
  geometries.push(...outerBuilt.geometries);

  const pocketGeo = new THREE.BoxGeometry(0.11, H - 0.1, 0.32);
  geometries.push(pocketGeo);
  const pocketMesh = new THREE.Mesh(pocketGeo, upvcInnerMat);
  pocketMesh.position.set(-W / 2 + 0.085, 0, 0);
  pocketMesh.userData.partInfo = DOOR_PART_DETAILS.door_outer_frame;
  outerFrameLayer.add(pocketMesh);

  registerHighlightable(outerFrameLayer, 'door_outer_frame');
  root.add(outerFrameLayer);
  explodableLayers.push({
    group: outerFrameLayer,
    basePos: new THREE.Vector3(0, 0, -0.04),
    explodeDelta: new THREE.Vector3(0, 0, -0.34),
  });

  // =========================================================================
  // LAYER 2: Heavy-Gauge GI Frame Steel Core (Closed Box & C-Channels)
  // =========================================================================
  const frameSteelLayer = new THREE.Group();
  const leftBoxGeo = createDoorClosedBoxGeo(H - 0.16, 0.12, 0.24, 0.022);
  leftBoxGeo.rotateX(Math.PI / 2);
  geometries.push(leftBoxGeo);

  const leftFrameSteel = new THREE.Mesh(leftBoxGeo, steelMat);
  leftFrameSteel.position.set(-W / 2 + 0.105, 0, 0);
  leftFrameSteel.castShadow = true;
  leftFrameSteel.userData.partInfo = DOOR_PART_DETAILS.door_frame_steel;
  frameSteelLayer.add(leftFrameSteel);

  const edgeLineMat = new THREE.LineBasicMaterial({
    color: 0x475569,
    transparent: true,
    opacity: 0.48,
  });
  materials.push(edgeLineMat);
  const leftBoxEdges = new THREE.EdgesGeometry(leftBoxGeo, 28);
  geometries.push(leftBoxEdges);
  const leftEdges = new THREE.LineSegments(leftBoxEdges, edgeLineMat);
  leftEdges.position.copy(leftFrameSteel.position);
  frameSteelLayer.add(leftEdges);

  const rightFrameSteel = new THREE.Mesh(leftBoxGeo, steelMat);
  rightFrameSteel.position.set(W / 2 - 0.105, 0, 0);
  rightFrameSteel.castShadow = true;
  rightFrameSteel.userData.partInfo = DOOR_PART_DETAILS.door_frame_steel;
  frameSteelLayer.add(rightFrameSteel);

  const headUGeo = createDoorChannelGeo(W - 0.28, 0.11, 0.22, 0.018, 0);
  headUGeo.rotateY(Math.PI / 2);
  geometries.push(headUGeo);
  const headSteel = new THREE.Mesh(headUGeo, steelMat);
  headSteel.position.set(0, H / 2 - 0.105, 0);
  headSteel.castShadow = true;
  headSteel.userData.partInfo = DOOR_PART_DETAILS.door_frame_steel;
  frameSteelLayer.add(headSteel);

  // Instanced anchoring screws along left frame steel box
  const screwGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 10);
  screwGeo.rotateZ(Math.PI / 2);
  geometries.push(screwGeo);
  const screwInstanced = new THREE.InstancedMesh(screwGeo, screwMat, 20);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 10; i++) {
    const yPos = -H / 2 + 0.28 + i * ((H - 0.56) / 9);
    dummy.position.set(-W / 2 + 0.168, yPos, 0.05);
    dummy.updateMatrix();
    screwInstanced.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(-W / 2 + 0.168, yPos, -0.05);
    dummy.updateMatrix();
    screwInstanced.setMatrixAt(i * 2 + 1, dummy.matrix);
  }
  screwInstanced.instanceMatrix.needsUpdate = true;
  screwInstanced.computeBoundingSphere();
  screwInstanced.userData.partInfo = DOOR_PART_DETAILS.door_frame_steel;
  frameSteelLayer.add(screwInstanced);

  registerHighlightable(frameSteelLayer, 'door_frame_steel');
  root.add(frameSteelLayer);
  explodableLayers.push({
    group: frameSteelLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(-0.28, 0, 0.34),
  });

  // =========================================================================
  // LAYER 3: Double-Glazed Vision Glass + Insulated Bottom Kick Panel
  // =========================================================================
  const infillLayer = new THREE.Group();
  const infillW = W - 0.62;
  const glassH = 1.48;
  const glassY = 0.42;

  const paneGeo = new THREE.BoxGeometry(infillW, glassH, 0.016);
  geometries.push(paneGeo);

  const frontPane = new THREE.Mesh(paneGeo, glassMat);
  frontPane.position.set(0, glassY, 0.042);
  frontPane.renderOrder = 4;
  frontPane.userData.partInfo = DOOR_PART_DETAILS.door_glass;
  infillLayer.add(frontPane);

  const backPane = new THREE.Mesh(paneGeo, glassMat);
  backPane.position.set(0, glassY, -0.042);
  backPane.renderOrder = 3;
  backPane.userData.partInfo = DOOR_PART_DETAILS.door_glass;
  infillLayer.add(backPane);

  const spacerBuilt = createDoorFrameBars(
    infillW - 0.01,
    glassH - 0.01,
    0.032,
    0.068,
    spacerMat,
    DOOR_PART_DETAILS.door_glass,
    false
  );
  spacerBuilt.group.position.set(0, glassY, 0);
  geometries.push(...spacerBuilt.geometries);
  infillLayer.add(spacerBuilt.group);

  // Gasket around vision unit
  const gasketBuilt = createDoorFrameBars(
    infillW + 0.05,
    glassH + 0.05,
    0.028,
    0.13,
    gasketMat,
    DOOR_PART_DETAILS.door_glass,
    false
  );
  gasketBuilt.group.position.set(0, glassY, 0);
  geometries.push(...gasketBuilt.geometries);
  infillLayer.add(gasketBuilt.group);

  infillLayer.position.set(0, 0, 0.08);
  registerHighlightable(infillLayer, 'door_glass');
  root.add(infillLayer);
  explodableLayers.push({
    group: infillLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 0.6),
  });

  // =========================================================================
  // LAYER 4: Heavy-Duty Door Sash Steel Reinforcement (2.0mm - 3.0mm Closed Box)
  // =========================================================================
  const sashSteelLayer = new THREE.Group();
  const sashInnerW = W - 0.34;
  const sashInnerH = H - 0.28;

  const vertSashBoxGeo = createDoorClosedBoxGeo(sashInnerH - 0.14, 0.095, 0.14, 0.024);
  vertSashBoxGeo.rotateX(Math.PI / 2);
  geometries.push(vertSashBoxGeo);

  const leftSashSteel = new THREE.Mesh(vertSashBoxGeo, steelHeavyMat);
  leftSashSteel.position.set(-sashInnerW / 2 + 0.075, 0, 0);
  leftSashSteel.castShadow = true;
  leftSashSteel.userData.partInfo = DOOR_PART_DETAILS.door_sash_steel;
  sashSteelLayer.add(leftSashSteel);

  const rightSashSteel = new THREE.Mesh(vertSashBoxGeo, steelHeavyMat);
  rightSashSteel.position.set(sashInnerW / 2 - 0.075, 0, 0);
  rightSashSteel.castShadow = true;
  rightSashSteel.userData.partInfo = DOOR_PART_DETAILS.door_sash_steel;
  sashSteelLayer.add(rightSashSteel);

  const sashBoxEdges = new THREE.EdgesGeometry(vertSashBoxGeo, 28);
  geometries.push(sashBoxEdges);
  const rEdgeLines = new THREE.LineSegments(sashBoxEdges, edgeLineMat);
  rEdgeLines.position.copy(rightSashSteel.position);
  sashSteelLayer.add(rEdgeLines);

  const horizSashCGeo = createDoorChannelGeo(sashInnerW - 0.22, 0.088, 0.135, 0.022, 0.02);
  horizSashCGeo.rotateY(Math.PI / 2);
  geometries.push(horizSashCGeo);

  const topSashSteel = new THREE.Mesh(horizSashCGeo, steelHeavyMat);
  topSashSteel.position.set(0, sashInnerH / 2 - 0.07, 0);
  topSashSteel.userData.partInfo = DOOR_PART_DETAILS.door_sash_steel;
  sashSteelLayer.add(topSashSteel);

  const midRailSteel = new THREE.Mesh(horizSashCGeo, steelHeavyMat);
  midRailSteel.position.set(0, -0.39, 0);
  midRailSteel.userData.partInfo = DOOR_PART_DETAILS.door_sash_steel;
  sashSteelLayer.add(midRailSteel);

  const botSashSteel = new THREE.Mesh(horizSashCGeo, steelHeavyMat);
  botSashSteel.position.set(0, -sashInnerH / 2 + 0.07, 0);
  botSashSteel.userData.partInfo = DOOR_PART_DETAILS.door_sash_steel;
  sashSteelLayer.add(botSashSteel);

  sashSteelLayer.position.set(0, 0, 0.16);
  registerHighlightable(sashSteelLayer, 'door_sash_steel');
  root.add(sashSteelLayer);
  explodableLayers.push({
    group: sashSteelLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0.24, 0, 0.88),
  });

  // =========================================================================
  // LAYER 5: Front Beveled uPVC Door Leaf + Mid-Rail + Insulated Kick Panel
  // =========================================================================
  const doorLeafLayer = new THREE.Group();
  const leafBuilt = createDoorFrameBars(
    W - 0.24,
    H - 0.22,
    0.16,
    0.15,
    upvcMat,
    DOOR_PART_DETAILS.door_sash_upvc,
    false
  );
  geometries.push(...leafBuilt.geometries);
  doorLeafLayer.add(leafBuilt.group);

  // Horizontal Mid-Transom Rail dividing Vision Glass and Kick Panel
  const midRailGeo = new THREE.BoxGeometry(W - 0.44, 0.15, 0.155);
  geometries.push(midRailGeo);
  const midRail = new THREE.Mesh(midRailGeo, upvcMat);
  midRail.position.set(0, -0.39, 0);
  midRail.castShadow = true;
  midRail.userData.partInfo = DOOR_PART_DETAILS.door_sash_upvc;
  doorLeafLayer.add(midRail);

  // Insulated Solid Bottom Kick Panel with subtle raised bevel
  const kickPanelGeo = new THREE.BoxGeometry(W - 0.56, 0.84, 0.09);
  geometries.push(kickPanelGeo);
  const kickPanel = new THREE.Mesh(kickPanelGeo, upvcInnerMat);
  kickPanel.position.set(0, -0.89, 0);
  kickPanel.castShadow = true;
  kickPanel.userData.partInfo = DOOR_PART_DETAILS.door_sash_upvc;
  doorLeafLayer.add(kickPanel);

  doorLeafLayer.position.set(0, 0, 0.22);
  registerHighlightable(doorLeafLayer, 'door_sash_upvc');
  root.add(doorLeafLayer);
  explodableLayers.push({
    group: doorLeafLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 1.18),
  });

  // =========================================================================
  // LAYER 6: Heavy-Duty 3D Hinges & Multi-Point Door Lever Handle
  // =========================================================================
  const hardwareLayer = new THREE.Group();

  // Escutcheon backplate + Lever Handle on right lock stile
  const plateGeo = new THREE.BoxGeometry(0.065, 0.34, 0.024);
  geometries.push(plateGeo);
  const plate = new THREE.Mesh(plateGeo, hardwareMat);
  plate.position.set(W / 2 - 0.22, -0.14, 0.31);
  plate.userData.partInfo = DOOR_PART_DETAILS.door_hardware;
  hardwareLayer.add(plate);

  const leverGeo = new THREE.BoxGeometry(0.18, 0.028, 0.045);
  geometries.push(leverGeo);
  const lever = new THREE.Mesh(leverGeo, hardwareMat);
  lever.position.set(W / 2 - 0.29, -0.09, 0.34);
  lever.userData.partInfo = DOOR_PART_DETAILS.door_hardware;
  hardwareLayer.add(lever);

  // 3 Heavy-Duty 3D Cylindrical Barrel Hinges on left hinge stile
  const hingeGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.14, 14);
  geometries.push(hingeGeo);
  const hingeYs = [H / 2 - 0.42, 0.02, -H / 2 + 0.42];
  for (const hy of hingeYs) {
    const hinge = new THREE.Mesh(hingeGeo, hardwareMat);
    hinge.position.set(-W / 2 + 0.16, hy, 0.28);
    hinge.userData.partInfo = DOOR_PART_DETAILS.door_hardware;
    hardwareLayer.add(hinge);
  }

  registerHighlightable(hardwareLayer, 'door_hardware');
  root.add(hardwareLayer);
  explodableLayers.push({
    group: hardwareLayer,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeDelta: new THREE.Vector3(0, 0, 1.32),
  });

  // =========================================================================
  // 3D Part-Tracking Anchors
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
    makeAnchor(outerFrameLayer, -0.52, H / 2 - 0.1, -0.05, DOOR_PART_DETAILS.door_outer_frame),
    makeAnchor(frameSteelLayer, -W / 2 + 0.1, 0.22, 0.08, DOOR_PART_DETAILS.door_frame_steel),
    makeAnchor(infillLayer, -0.45, 0.55, 0.08, DOOR_PART_DETAILS.door_glass),
    makeAnchor(sashSteelLayer, 0.62, 0.35, 0.18, DOOR_PART_DETAILS.door_sash_steel),
    makeAnchor(doorLeafLayer, -0.45, -0.92, 0.24, DOOR_PART_DETAILS.door_sash_upvc),
    makeAnchor(hardwareLayer, W / 2 - 0.22, -0.1, 0.34, DOOR_PART_DETAILS.door_hardware),
  ];

  // Center taller door nicely on the same studio Y pivot
  root.position.set(0, 1.46, 0);

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
        mat.emissive.setHex(item.partId.includes('steel') ? 0x3b0d14 : 0x1e293b);
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

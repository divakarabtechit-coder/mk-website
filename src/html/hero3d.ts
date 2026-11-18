import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { createProceduralTextures } from '../three/proceduralTextures';
import {
  buildWindowAssembly,
  PartInspectionInfo,
  TrackedPartAnchor,
} from '../three/windowAssembly';
import { buildDoorAssembly } from '../three/doorAssembly';

type ShowcaseModelType = 'window' | 'door';

const _pointerNdc = new THREE.Vector2();
const _anchorWorld = new THREE.Vector3();
const _projectedNdc = new THREE.Vector3();

const WINDOW_PART_ITEMS: PartInspectionInfo[] = [
  {
    id: 'upvc_outer_frame',
    name: 'Multi-Chamber uPVC Frame',
    spec: 'Cutaway Outer Profile · Precision 0.2mm Core Fitment',
  },
  {
    id: 'steel_c_channel',
    name: 'GI C-Channel Frame Core',
    spec: 'Hot-Dip Galvanized · 1.5mm – 2.0mm · Return-Lip Stiffener',
  },
  {
    id: 'igu_glass',
    name: 'Double-Glazed Insulated Unit',
    spec: 'Dual Low-E Glass + Anodized Warm-Edge Spacer Frame',
  },
  {
    id: 'steel_box_mullion',
    name: 'Closed Box Mullion Section',
    spec: 'Heavy-Duty 2.0mm – 3.0mm · Multi-Axis Wind-Load Resistance',
  },
  {
    id: 'steel_sash_u',
    name: 'Sash U-Channel Steel Core',
    spec: 'Cold Roll-Formed GI · Inline Punched Hardware Anchoring',
  },
  {
    id: 'upvc_sash_front',
    name: 'Beveled Mitered Sliding Sash',
    spec: '45° Fusion-Welded uPVC Sash with Glazing Bead',
  },
];

const DOOR_PART_ITEMS: PartInspectionInfo[] = [
  {
    id: 'door_outer_frame',
    name: 'Multi-Chamber uPVC Door Frame',
    spec: 'Cutaway Outer Jamb · Heavy-Traffic Structural Profile',
  },
  {
    id: 'door_frame_steel',
    name: 'Heavy-Gauge Frame Steel Core',
    spec: 'Hot-Dip GI 1.5mm – 2.5mm · Anti-Warp Closed Box',
  },
  {
    id: 'door_glass',
    name: 'Double-Glazed Vision Panel',
    spec: 'Dual Low-E Glass + Anodized Warm-Edge Spacer',
  },
  {
    id: 'door_sash_steel',
    name: 'Heavy-Duty Door Sash Steel',
    spec: 'Thick-Gauge 2.0mm – 3.0mm · High-Span Sash Core',
  },
  {
    id: 'door_sash_upvc',
    name: 'Beveled uPVC Door Leaf',
    spec: '45° Welded Sash + Insulated Bottom Kick Panel',
  },
  {
    id: 'door_hardware',
    name: '3D Hinges & Multi-Point Lock',
    spec: 'Direct Steel-Core Fastening · Commercial Grade',
  },
];

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hero-3d-showcase');
  const mount = document.getElementById('hero-3d-canvas-mount');
  const overlay = document.getElementById('hero-3d-track-overlay');
  const svgLines = document.getElementById('hero-3d-track-lines');
  const labelsHost = document.getElementById('hero-3d-track-labels');
  const btnWindow = document.getElementById('hero-tab-window');
  const btnDoor = document.getElementById('hero-tab-door');
  const fallbackEl = document.getElementById('hero-3d-fallback');

  if (!container || !mount || !overlay || !svgLines || !labelsHost) return;

  let activeModel: ShowcaseModelType = 'window';
  let isHovered = false;
  let activePartId: string | null = null;
  let userDragging = false;
  let remainingMs = 10000;
  let startedAt = performance.now();
  let timerId = 0;

  let dotEls: HTMLDivElement[] = [];
  let labelEls: HTMLDivElement[] = [];
  let lineEls: SVGLineElement[] = [];

  const createTrackOverlay = (items: PartInspectionInfo[]) => {
    svgLines.innerHTML = '';
    labelsHost.innerHTML = '';
    dotEls = [];
    labelEls = [];
    lineEls = [];

    items.forEach((item) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', '1.1');
      line.setAttribute('stroke-dasharray', '3 3');
      svgLines.appendChild(line);
      lineEls.push(line);

      const dot = document.createElement('div');
      dot.className = 'absolute top-0 left-0 h-2 w-2 rounded-full transition-colors duration-150 bg-[#111111] ring-2 ring-white/90';
      labelsHost.appendChild(dot);
      dotEls.push(dot);

      const box = document.createElement('div');
      box.className = 'absolute top-0 left-0 w-[148px] sm:w-[190px] rounded-md border px-2 py-1 shadow-sm transition-colors duration-150 bg-white/95 border-slate-200/90 text-[#111111]';
      box.innerHTML = `
        <div class="truncate text-[10px] sm:text-[11px] font-semibold leading-tight text-[#111111]">${item.name}</div>
        <div class="truncate text-[9px] font-mono text-slate-500 mt-0.5">${item.spec.split('·')[0].trim()}</div>
      `;
      labelsHost.appendChild(box);
      labelEls.push(box);
    });
  };

  const syncTrackHighlight = () => {
    const items = activeModel === 'window' ? WINDOW_PART_ITEMS : DOOR_PART_ITEMS;
    items.forEach((item, idx) => {
      const highlighted = activePartId === item.id;
      const line = lineEls[idx];
      const dot = dotEls[idx];
      const box = labelEls[idx];
      if (!line || !dot || !box) return;

      line.setAttribute('stroke', highlighted ? '#C8102E' : '#94a3b8');
      line.setAttribute('stroke-width', highlighted ? '1.8' : '1.1');

      dot.className = `absolute top-0 left-0 h-2 w-2 rounded-full transition-colors duration-150 ${
        highlighted ? 'bg-[#C8102E] ring-2 ring-red-100' : 'bg-[#111111] ring-2 ring-white/90'
      }`;

      box.className = `absolute top-0 left-0 w-[148px] sm:w-[190px] rounded-md border px-2 py-1 shadow-sm transition-colors duration-150 ${
        highlighted
          ? 'bg-[#C8102E] border-[#C8102E] text-white'
          : 'bg-white/95 border-slate-200/90 text-[#111111]'
      }`;
      const titleEl = box.children[0] as HTMLElement | undefined;
      const subEl = box.children[1] as HTMLElement | undefined;
      if (titleEl) titleEl.className = `truncate text-[10px] sm:text-[11px] font-semibold leading-tight ${highlighted ? 'text-white' : 'text-[#111111]'}`;
      if (subEl) subEl.className = `truncate text-[9px] font-mono mt-0.5 ${highlighted ? 'text-red-100' : 'text-slate-500'}`;
    });
  };

  const renderTabsUI = () => {
    const resetBar = (btn: HTMLElement | null, active: boolean) => {
      if (!btn) return;
      const oldBar = btn.querySelector('.mk-load-bar');
      if (oldBar) oldBar.remove();
      if (active) {
        btn.className =
          'relative overflow-hidden rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer bg-[#111111] text-white whitespace-nowrap shrink-0';
        const bar = document.createElement('span');
        bar.className = 'mk-load-bar pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#C8102E]';
        bar.style.animationPlayState = isHovered ? 'paused' : 'running';
        btn.appendChild(bar);
      } else {
        btn.className =
          'relative overflow-hidden rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer bg-slate-100 text-[#111111] hover:bg-slate-200 whitespace-nowrap shrink-0';
      }
    };
    resetBar(btnWindow, activeModel === 'window');
    resetBar(btnDoor, activeModel === 'door');
  };

  const pauseBarAnimation = (paused: boolean) => {
    const bar = container.querySelector<HTMLElement>('.mk-load-bar');
    if (bar) bar.style.animationPlayState = paused ? 'paused' : 'running';
  };

  const scheduleNextCycle = () => {
    window.clearTimeout(timerId);
    if (isHovered) return;
    startedAt = performance.now();
    timerId = window.setTimeout(() => {
      remainingMs = 10000;
      activeModel = activeModel === 'window' ? 'door' : 'window';
      activePartId = null;
      createTrackOverlay(activeModel === 'window' ? WINDOW_PART_ITEMS : DOOR_PART_ITEMS);
      syncTrackHighlight();
      renderTabsUI();
      scheduleNextCycle();
    }, Math.max(50, remainingMs));
  };

  const selectModel = (model: ShowcaseModelType) => {
    window.clearTimeout(timerId);
    activeModel = model;
    remainingMs = 10000;
    activePartId = null;
    createTrackOverlay(activeModel === 'window' ? WINDOW_PART_ITEMS : DOOR_PART_ITEMS);
    syncTrackHighlight();
    renderTabsUI();
    if (!isHovered) scheduleNextCycle();
  };

  btnWindow?.addEventListener('click', () => selectModel('window'));
  btnDoor?.addEventListener('click', () => selectModel('door'));

  container.addEventListener('mouseenter', () => {
    if (!isHovered) {
      const elapsed = performance.now() - startedAt;
      remainingMs = Math.max(50, remainingMs - elapsed);
    }
    isHovered = true;
    window.clearTimeout(timerId);
    pauseBarAnimation(true);
    overlay.style.opacity = '1';
  });

  container.addEventListener('mouseleave', () => {
    isHovered = false;
    pauseBarAnimation(false);
    overlay.style.opacity = '0';
    scheduleNextCycle();
  });

  createTrackOverlay(WINDOW_PART_ITEMS);
  renderTabsUI();
  scheduleNextCycle();

  const isSoftwareGl = detectSoftwareWebGL();
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    fallbackEl?.classList.remove('hidden');
    return;
  }

  const width = Math.max(mount.clientWidth, 320);
  const height = Math.max(mount.clientHeight, 260);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  mount.innerHTML = '';
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = null;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envTarget.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  const initialAspect = width / height;
  const camera = new THREE.PerspectiveCamera(initialAspect < 1.25 ? 42 : 36, initialAspect, 0.1, 60);
  camera.position.set(-3.2, 2.08, 5.95);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.46, 0.18);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.update();

  controls.addEventListener('start', () => {
    userDragging = true;
  });
  controls.addEventListener('end', () => {
    userDragging = false;
  });

  const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0xdbe3ec, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff9f2, 1.85);
  keyLight.position.set(4.5, 6.5, 5.2);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    const d = 3.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xdceeff, 1.25);
  rimLight.position.set(-4.5, 3.8, -4.0);
  scene.add(rimLight);

  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    const softboxLeft = new THREE.RectAreaLight(0xffffff, 2.2, 3.2, 4.0);
    softboxLeft.position.set(-4.2, 2.6, 2.4);
    softboxLeft.lookAt(0, 1.4, 0);
    scene.add(softboxLeft);

    const softboxTop = new THREE.RectAreaLight(0xf8fafc, 1.6, 4.2, 2.4);
    softboxTop.position.set(0.5, 5.0, 1.5);
    softboxTop.lookAt(0, 1.4, 0);
    scene.add(softboxTop);
  }

  const textures = createProceduralTextures(renderer.capabilities.getMaxAnisotropy());
  const turntableGroup = new THREE.Group();
  turntableGroup.rotation.y = -0.28;
  scene.add(turntableGroup);

  const windowSlot = new THREE.Group();
  const windowAssembly = buildWindowAssembly(textures, isSoftwareGl);
  windowSlot.add(windowAssembly.root);
  turntableGroup.add(windowSlot);

  const doorSlot = new THREE.Group();
  const doorAssembly = buildDoorAssembly(textures, isSoftwareGl);
  doorSlot.add(doorAssembly.root);
  doorSlot.visible = false;
  doorSlot.scale.setScalar(0.75);
  turntableGroup.add(doorSlot);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const syncAllPartLabels = (anchors: TrackedPartAnchor[]) => {
    const cw = mount.clientWidth || 1;
    const ch = mount.clientHeight || 1;
    const isNarrow = cw < 520;
    const labelW = isNarrow ? 148 : 190;
    const labelH = 34;

    for (let i = 0; i < anchors.length; i++) {
      const dotEl = dotEls[i];
      const labelEl = labelEls[i];
      const lineEl = lineEls[i];
      if (!dotEl || !labelEl || !lineEl) continue;

      anchors[i].anchor.getWorldPosition(_anchorWorld);
      _projectedNdc.copy(_anchorWorld).project(camera);

      const px = (_projectedNdc.x + 1) * 0.5 * cw;
      const py = (-_projectedNdc.y + 1) * 0.5 * ch;

      dotEl.style.transform = `translate3d(${(px - 4).toFixed(1)}px, ${(py - 4).toFixed(1)}px, 0)`;

      const placeLeft = px < cw * 0.5;
      const placeAbove = py < ch * 0.52;
      const offsetX = isNarrow ? 14 : 26;
      const offsetY = isNarrow ? 12 : 18;

      const targetX = placeLeft ? px - labelW - offsetX : px + offsetX;
      const targetY = placeAbove ? py - labelH - offsetY : py + offsetY;

      const boxX = Math.max(6, Math.min(targetX, cw - labelW - 6));
      const boxY = Math.max(6, Math.min(targetY, ch - labelH - 6));

      labelEl.style.transform = `translate3d(${boxX.toFixed(1)}px, ${boxY.toFixed(1)}px, 0)`;

      const connectX = placeLeft ? boxX + labelW : boxX;
      const connectY = boxY + labelH * 0.5;

      lineEl.setAttribute('x1', px.toFixed(1));
      lineEl.setAttribute('y1', py.toFixed(1));
      lineEl.setAttribute('x2', connectX.toFixed(1));
      lineEl.setAttribute('y2', connectY.toFixed(1));
    }
  };

  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);
  let lastRaycastTime = 0;
  let lastCheckedModel: ShowcaseModelType = activeModel;

  const updateHoverInspection = (clientX: number, clientY: number) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const currentAsm = activeModel === 'window' ? windowAssembly : doorAssembly;
    _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(_pointerNdc, camera);
    const hits = raycaster.intersectObjects(currentAsm.interactables, false);

    if (hits.length > 0) {
      const info = hits[0].object.userData.partInfo as PartInspectionInfo | undefined;
      renderer.domElement.style.cursor = 'pointer';
      if (info && info.id !== activePartId) {
        activePartId = info.id;
        windowAssembly.setHighlightPart(activeModel === 'window' ? info.id : null);
        doorAssembly.setHighlightPart(activeModel === 'door' ? info.id : null);
        syncTrackHighlight();
      }
    } else {
      renderer.domElement.style.cursor = 'grab';
      if (activePartId !== null) {
        activePartId = null;
        windowAssembly.setHighlightPart(null);
        doorAssembly.setHighlightPart(null);
        syncTrackHighlight();
      }
    }
  };

  renderer.domElement.addEventListener('pointermove', (event: PointerEvent) => {
    const now = performance.now();
    if (now - lastRaycastTime < 36) return;
    lastRaycastTime = now;
    updateHoverInspection(event.clientX, event.clientY);
  });

  renderer.domElement.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      isHovered = !isHovered;
      overlay.style.opacity = isHovered ? '1' : '0';
      pauseBarAnimation(isHovered);
      updateHoverInspection(event.clientX, event.clientY);
    }
  });

  renderer.domElement.addEventListener('pointerleave', () => {
    renderer.domElement.style.cursor = 'grab';
    if (activePartId !== null) {
      activePartId = null;
      windowAssembly.setHighlightPart(null);
      doorAssembly.setHighlightPart(null);
      syncTrackHighlight();
    }
  });

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = Math.max(entry.contentRect.width, 260);
      const h = Math.max(entry.contentRect.height, 240);
      const aspect = w / h;
      camera.aspect = aspect;
      camera.fov = aspect < 1.25 ? 42 : 36;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  resizeObserver.observe(mount);

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let explodeCurrent = 0;
  let windowVis = 1;
  let doorVis = 0;
  let lastTime = performance.now();
  let disposed = false;
  let frameId = 0;

  function afterDraw(cb: () => void) {
    if (disposed) return;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    if (disposed) return;
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;

    if (activeModel !== lastCheckedModel) {
      lastCheckedModel = activeModel;
      activePartId = null;
      windowAssembly.setHighlightPart(null);
      doorAssembly.setHighlightPart(null);
    }

    windowVis = THREE.MathUtils.damp(windowVis, activeModel === 'window' ? 1 : 0, 6.5, delta);
    doorVis = THREE.MathUtils.damp(doorVis, activeModel === 'door' ? 1 : 0, 6.5, delta);

    windowSlot.visible = windowVis > 0.02;
    windowSlot.scale.setScalar(0.74 + 0.26 * windowVis);
    windowSlot.position.y = (1 - windowVis) * -0.3;

    doorSlot.visible = doorVis > 0.02;
    doorSlot.scale.setScalar(0.74 + 0.26 * doorVis);
    doorSlot.position.y = (1 - doorVis) * -0.3;

    explodeCurrent = THREE.MathUtils.damp(explodeCurrent, isHovered ? 1 : 0, 6.8, delta);
    windowAssembly.applyExplode(explodeCurrent);
    doorAssembly.applyExplode(explodeCurrent);

    if (!prefersReducedMotion && !userDragging && !isHovered) {
      turntableGroup.rotation.y += delta * 0.26;
    }

    controls.update();
    syncAllPartLabels(activeModel === 'window' ? windowAssembly.partAnchors : doorAssembly.partAnchors);
    renderer.render(scene, camera);

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);
  }

  tick();

  window.addEventListener('beforeunload', () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    resizeObserver.disconnect();
    controls.dispose();
    windowAssembly.dispose();
    doorAssembly.dispose();
    textures.dispose();
    envTarget.dispose();
    renderer.dispose();
  });
});

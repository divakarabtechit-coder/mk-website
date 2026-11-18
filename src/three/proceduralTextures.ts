import * as THREE from 'three';

export interface ProceduralTextureSet {
  galvanizedColor: THREE.CanvasTexture;
  galvanizedRoughness: THREE.CanvasTexture;
  galvanizedBump: THREE.CanvasTexture;
  upvcRoughness: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates zero-dependency procedural textures for hot-dip galvanized steel
 * (zinc crystal spangle + cold-roll brushed lines), satin white uPVC extrusion,
 * and soft radial studio contact shadows.
 */
export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const anisotropy = Math.max(1, Math.min(maxAnisotropy, 8));

  // 1. Hot-Dip Galvanized Steel Color (Zinc Spangle + Brushed Roll Grain)
  const galvColorCanvas = document.createElement('canvas');
  galvColorCanvas.width = 512;
  galvColorCanvas.height = 512;
  const gCtx = galvColorCanvas.getContext('2d')!;
  gCtx.fillStyle = '#c9d0d8';
  gCtx.fillRect(0, 0, 512, 512);

  // Subtle Voronoi-like crystalline zinc spangles
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 420; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 8 + rand() * 24;
    const sides = 4 + Math.floor(rand() * 3);
    const shade = Math.floor(178 + rand() * 52);
    gCtx.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 10}, 0.34)`;
    gCtx.beginPath();
    for (let s = 0; s < sides; s++) {
      const ang = (s / sides) * Math.PI * 2 + rand() * 0.5;
      const px = x + Math.cos(ang) * r;
      const py = y + Math.sin(ang) * r;
      if (s === 0) gCtx.moveTo(px, py);
      else gCtx.lineTo(px, py);
    }
    gCtx.closePath();
    gCtx.fill();
  }

  // Fine longitudinal roll-forming draw lines
  for (let i = 0; i < 650; i++) {
    const x = rand() * 512;
    const alpha = 0.04 + rand() * 0.08;
    const bright = rand() > 0.5 ? 245 : 135;
    gCtx.fillStyle = `rgba(${bright}, ${bright + 2}, ${bright + 5}, ${alpha})`;
    gCtx.fillRect(x, 0, 1 + rand() * 1.5, 512);
  }

  const galvanizedColor = new THREE.CanvasTexture(galvColorCanvas);
  galvanizedColor.colorSpace = THREE.SRGBColorSpace;
  galvanizedColor.wrapS = THREE.RepeatWrapping;
  galvanizedColor.wrapT = THREE.RepeatWrapping;
  galvanizedColor.repeat.set(2, 4);
  galvanizedColor.anisotropy = anisotropy;

  // 2. Galvanized Roughness Map (Linear / NoColorSpace)
  const galvRoughCanvas = document.createElement('canvas');
  galvRoughCanvas.width = 512;
  galvRoughCanvas.height = 512;
  const rCtx = galvRoughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#4a4a4a';
  rCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 380; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 10 + rand() * 22;
    const val = Math.floor(42 + rand() * 68);
    rCtx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.42)`;
    rCtx.beginPath();
    rCtx.arc(x, y, r, 0, Math.PI * 2);
    rCtx.fill();
  }

  const galvanizedRoughness = new THREE.CanvasTexture(galvRoughCanvas);
  galvanizedRoughness.colorSpace = THREE.NoColorSpace;
  galvanizedRoughness.wrapS = THREE.RepeatWrapping;
  galvanizedRoughness.wrapT = THREE.RepeatWrapping;
  galvanizedRoughness.repeat.set(2, 4);
  galvanizedRoughness.anisotropy = anisotropy;

  // 3. Galvanized Bump Map (Linear / NoColorSpace)
  const galvBumpCanvas = document.createElement('canvas');
  galvBumpCanvas.width = 256;
  galvBumpCanvas.height = 256;
  const bCtx = galvBumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    const x = rand() * 256;
    const v = Math.floor(112 + rand() * 32);
    bCtx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.35)`;
    bCtx.fillRect(x, 0, 1, 256);
  }
  const galvanizedBump = new THREE.CanvasTexture(galvBumpCanvas);
  galvanizedBump.colorSpace = THREE.NoColorSpace;
  galvanizedBump.wrapS = THREE.RepeatWrapping;
  galvanizedBump.wrapT = THREE.RepeatWrapping;
  galvanizedBump.repeat.set(3, 6);
  galvanizedBump.anisotropy = anisotropy;

  // 4. Satin White uPVC Micro-Extrusion Roughness
  const upvcCanvas = document.createElement('canvas');
  upvcCanvas.width = 256;
  upvcCanvas.height = 256;
  const uCtx = upvcCanvas.getContext('2d')!;
  uCtx.fillStyle = '#525252';
  uCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    const y = rand() * 256;
    const v = Math.floor(72 + rand() * 22);
    uCtx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.25)`;
    uCtx.fillRect(0, y, 256, 1.5);
  }
  const upvcRoughness = new THREE.CanvasTexture(upvcCanvas);
  upvcRoughness.colorSpace = THREE.NoColorSpace;
  upvcRoughness.wrapS = THREE.RepeatWrapping;
  upvcRoughness.wrapT = THREE.RepeatWrapping;
  upvcRoughness.anisotropy = anisotropy;

  // 5. Soft Studio Contact Shadow Map
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 512;
  shadowCanvas.height = 512;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(256, 256, 20, 256, 256, 240);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.34)');
  grad.addColorStop(0.42, 'rgba(15, 23, 42, 0.16)');
  grad.addColorStop(0.75, 'rgba(15, 23, 42, 0.04)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 512, 512);

  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);
  contactShadowMap.colorSpace = THREE.SRGBColorSpace;

  return {
    galvanizedColor,
    galvanizedRoughness,
    galvanizedBump,
    upvcRoughness,
    contactShadowMap,
    dispose: () => {
      galvanizedColor.dispose();
      galvanizedRoughness.dispose();
      galvanizedBump.dispose();
      upvcRoughness.dispose();
      contactShadowMap.dispose();
    },
  };
}

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PageId, PRODUCTS } from '../data/siteContent';
import { CameraPresetMode, ProfileStructureCanvas, ProfileStructureState } from '../r3f/ProfileStructureCanvas';

function renderCadCrossSection(pid: PageId): string {
  if (pid === 'product-door') {
    return `
      <rect x="78" y="26" width="124" height="92" rx="8" fill="none" stroke="#111111" stroke-width="8" />
      <rect x="86" y="34" width="108" height="76" rx="4" fill="none" stroke="#C8102E" stroke-width="1.5" stroke-dasharray="3 3" />
      <line x1="78" y1="132" x2="202" y2="132" stroke="#64748B" stroke-width="1.2" />
      <text x="140" y="146" text-anchor="middle" class="fill-[#111111] text-[10px] font-mono">40 × 40 mm Closed Box · 1.5–2.5 mm</text>
    `;
  }
  if (pid === 'product-channels') {
    return `
      <path d="M98 42 H60 V106 H98 V92" fill="none" stroke="#111111" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" />
      <path d="M132 42 V106 H184 V42" fill="none" stroke="#C8102E" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" />
      <path d="M214 42 V106 H258" fill="none" stroke="#111111" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" />
      <text x="155" y="142" text-anchor="middle" class="fill-[#111111] text-[10px] font-mono">GI Return-Lip C · U · L Profiles (1.0–2.5 mm)</text>
    `;
  }
  if (pid === 'product-heavy-sash') {
    return `
      <rect x="70" y="22" width="140" height="98" rx="9" fill="none" stroke="#111111" stroke-width="11" />
      <line x1="140" y1="26" x2="140" y2="116" stroke="#C8102E" stroke-width="6" />
      <text x="140" y="144" text-anchor="middle" class="fill-[#111111] text-[10px] font-mono">50 × 35 mm Heavy Ribbed Box · 2.0–3.0 mm</text>
    `;
  }
  return `
    <path d="M182 44 V32 Q182 24 174 24 H102 Q94 24 94 32 V110 Q94 118 102 118 H174 Q182 118 182 110 V98" fill="none" stroke="#111111" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="140" y="144" text-anchor="middle" class="fill-[#111111] text-[10px] font-mono">28 × 28 mm GI C-Channel · 1.0–2.0 mm</text>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('profile-3d-mount');
  const titleEl = document.getElementById('profile-3d-title');
  const specEl = document.getElementById('profile-3d-spec');
  const cadSvgEl = document.getElementById('product-cad-svg');
  const explodeBtn = document.getElementById('profile-explode-btn');
  const xrayBtn = document.getElementById('profile-xray-btn');
  const rotateBtn = document.getElementById('profile-rotate-btn');
  const cameraBtns = document.querySelectorAll<HTMLElement>('[data-camera-preset]');
  const selectButtons = document.querySelectorAll<HTMLElement>('[data-profile-select]');

  if (!mount) return;

  const hashId = window.location.hash.replace(/^#/, '') as PageId;
  const initialId: PageId = PRODUCTS.some((p) => p.id === hashId) ? hashId : 'product-window';

  const state: ProfileStructureState = {
    productId: initialId,
    explodeLocked: false,
    xrayMode: false,
    autoRotate: true,
    cameraPreset: 'isometric',
  };

  let r3fRoot: Root | null = null;
  try {
    r3fRoot = createRoot(mount);
  } catch {
    return;
  }

  const renderCanvas = () => {
    r3fRoot?.render(React.createElement(ProfileStructureCanvas, { state: { ...state } }));
  };

  const syncDetails = (pid: PageId) => {
    const prod = PRODUCTS.find((p) => p.id === pid) || PRODUCTS[0];
    if (titleEl) titleEl.textContent = prod.title;
    if (specEl) specEl.textContent = `${prod.thicknessRange} · ${prod.coatingStandard}`;
    if (cadSvgEl) cadSvgEl.innerHTML = renderCadCrossSection(prod.id);

    selectButtons.forEach((btn) => {
      const match = btn.dataset.profileSelect === prod.id;
      btn.classList.toggle('border-[#C8102E]', match);
      btn.classList.toggle('bg-[#F8FAFC]', match);
      btn.classList.toggle('border-slate-200', !match);
      btn.classList.toggle('bg-white', !match);
    });

    const detailHeading = document.getElementById('product-detail-title');
    const detailHeadline = document.getElementById('product-detail-headline');
    const detailSummary = document.getElementById('product-detail-summary');
    const detailMeta = document.getElementById('product-detail-meta');
    const matrixThickness = document.getElementById('matrix-thickness');
    const matrixCoating = document.getElementById('matrix-coating');
    const matrixShapes = document.getElementById('matrix-shapes');
    const appsHost = document.getElementById('product-applications-list');
    const featsHost = document.getElementById('product-features-list');

    if (detailHeading) detailHeading.textContent = prod.title;
    if (detailHeadline) detailHeadline.textContent = prod.headline;
    if (detailSummary) detailSummary.textContent = prod.summary;
    if (detailMeta) detailMeta.textContent = `${prod.thicknessRange} · ${prod.coatingStandard}`;
    if (matrixThickness) matrixThickness.textContent = prod.thicknessRange;
    if (matrixCoating) matrixCoating.textContent = prod.coatingStandard;
    if (matrixShapes) matrixShapes.textContent = prod.profileShapes;

    if (appsHost) {
      appsHost.innerHTML = prod.applications
        .map(
          (item, i) => `
          <div class="py-4">
            <h3 class="text-base font-semibold text-[#111111]">0${i + 1}. ${item.title}</h3>
            <p class="mt-1 text-sm leading-relaxed text-[#111111]">${item.detail}</p>
          </div>`
        )
        .join('');
    }
    if (featsHost) {
      featsHost.innerHTML = prod.features
        .map(
          (item, i) => `
          <div class="py-4">
            <h3 class="text-base font-semibold text-[#111111]">0${i + 1}. ${item.title}</h3>
            <p class="mt-1 text-sm leading-relaxed text-[#111111]">${item.detail}</p>
          </div>`
        )
        .join('');
    }
  };

  const loadProfile = (pid: PageId) => {
    state.productId = pid;
    syncDetails(pid);
    renderCanvas();
  };

  explodeBtn?.addEventListener('click', () => {
    state.explodeLocked = !state.explodeLocked;
    explodeBtn.textContent = state.explodeLocked ? 'Assemble Core' : 'Explode Cutaway';
    explodeBtn.classList.toggle('bg-[#C8102E]', state.explodeLocked);
    explodeBtn.classList.toggle('text-white', state.explodeLocked);
    explodeBtn.classList.toggle('border-[#C8102E]', state.explodeLocked);
    renderCanvas();
  });

  xrayBtn?.addEventListener('click', () => {
    state.xrayMode = !state.xrayMode;
    xrayBtn.textContent = state.xrayMode ? 'Solid uPVC' : 'X-Ray Core';
    xrayBtn.classList.toggle('bg-[#111111]', state.xrayMode);
    xrayBtn.classList.toggle('text-white', state.xrayMode);
    xrayBtn.classList.toggle('border-[#111111]', state.xrayMode);
    renderCanvas();
  });

  rotateBtn?.addEventListener('click', () => {
    state.autoRotate = !state.autoRotate;
    rotateBtn.textContent = state.autoRotate ? 'Pause Rotation' : 'Resume Rotation';
    renderCanvas();
  });

  cameraBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.cameraPreset as CameraPresetMode | undefined;
      if (!preset) return;
      state.cameraPreset = preset;
      cameraBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('bg-[#111111]', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('bg-white', !active);
        b.classList.toggle('text-[#111111]', !active);
      });
      renderCanvas();
    });
  });

  selectButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.profileSelect as PageId | undefined;
      if (targetId) loadProfile(targetId);
    });
  });

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace(/^#/, '') as PageId;
    if (PRODUCTS.some((p) => p.id === h)) loadProfile(h);
  });

  loadProfile(initialId);

  window.addEventListener('beforeunload', () => {
    r3fRoot?.unmount();
  });
});

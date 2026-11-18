import { MILESTONES, PRODUCTION_FLOW_STEPS, ProductionFlowStep } from '../data/siteContent';

function renderSchematicSvg(stage: ProductionFlowStep['stageGeometry']): string {
  const baseGrid = `
    <line x1="20" y1="120" x2="340" y2="120" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" />
    <line x1="180" y1="16" x2="180" y2="134" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
  `;

  if (stage === 'coil') {
    return `${baseGrid}
      <circle cx="115" cy="74" r="36" fill="none" stroke="#111111" stroke-width="7" />
      <circle cx="115" cy="74" r="22" fill="none" stroke="#64748B" stroke-width="4" />
      <circle cx="115" cy="74" r="10" fill="none" stroke="#C8102E" stroke-width="3" />
      <path d="M115 38 L285 38" stroke="#111111" stroke-width="6" stroke-linecap="round" />
      <path d="M262 28 L292 38 L262 48" fill="none" stroke="#C8102E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <text x="195" y="64" class="fill-[#111111] text-[11px] font-mono">Hot-Dip GI Master Coil</text>
      <text x="195" y="82" class="fill-slate-500 text-[10px] font-mono">1.0 – 3.0 mm Zinc Coat</text>
    `;
  }

  if (stage === 'slit') {
    return `${baseGrid}
      <rect x="46" y="42" width="268" height="8" fill="#111111" rx="1" />
      <rect x="46" y="68" width="268" height="8" fill="#111111" rx="1" />
      <rect x="46" y="94" width="268" height="8" fill="#111111" rx="1" />
      <line x1="90" y1="24" x2="90" y2="116" stroke="#C8102E" stroke-width="2" stroke-dasharray="3 3" />
      <line x1="270" y1="24" x2="270" y2="116" stroke="#C8102E" stroke-width="2" stroke-dasharray="3 3" />
      <text x="122" y="136" class="fill-[#C8102E] text-[10px] font-mono">±0.15 mm Precision Width Strips</text>
    `;
  }

  if (stage === 'channel') {
    return `${baseGrid}
      <path d="M36 96 L88 96" stroke="#94A3B8" stroke-width="5" stroke-linecap="round" />
      <path d="M114 78 L120 96 L158 96 L164 78" fill="none" stroke="#64748B" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
      <path d="M188 54 L188 96 L236 96 L236 54" fill="none" stroke="#111111" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round" />
      <path d="M276 62 L262 62 L262 96 L322 96 L322 62 L308 62" fill="none" stroke="#C8102E" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />
      <text x="44" y="136" class="fill-slate-500 text-[10px] font-mono">Progressive Multi-Stand Cold Forming</text>
    `;
  }

  if (stage === 'punch') {
    return `${baseGrid}
      <path d="M50 56 L310 56 L310 98 L50 98 Z" fill="none" stroke="#111111" stroke-width="3.5" />
      <rect x="85" y="70" width="38" height="14" rx="7" fill="#FFFFFF" stroke="#C8102E" stroke-width="2.5" />
      <circle cx="180" cy="77" r="7" fill="#FFFFFF" stroke="#C8102E" stroke-width="2.5" />
      <rect x="237" y="70" width="38" height="14" rx="7" fill="#FFFFFF" stroke="#C8102E" stroke-width="2.5" />
      <path d="M180 22 L180 48" stroke="#C8102E" stroke-width="2.5" />
      <path d="M174 42 L180 50 L186 42" fill="none" stroke="#C8102E" stroke-width="2.5" stroke-linecap="round" />
      <text x="95" y="136" class="fill-[#111111] text-[10px] font-mono">Hardware Lock &amp; Drainage Slots (±0.25 mm)</text>
    `;
  }

  if (stage === 'preform') {
    return `${baseGrid}
      <path d="M40 62 L212 62 L212 96 L40 96 Z" fill="#E2E8F0" stroke="#111111" stroke-width="3" />
      <path d="M236 62 L322 62 L322 96 L236 96 Z" fill="#F8FAFC" stroke="#111111" stroke-width="3" />
      <line x1="224" y1="30" x2="224" y2="114" stroke="#C8102E" stroke-width="3" stroke-dasharray="5 3" />
      <text x="86" y="136" class="fill-[#111111] text-[10px] font-mono">Synchronized Cut-to-Length (±0.50 mm)</text>
    `;
  }

  if (stage === 'qc') {
    return `${baseGrid}
      <rect x="136" y="48" width="88" height="58" fill="none" stroke="#111111" stroke-width="6" rx="2" />
      <path d="M112 77 L132 77" stroke="#C8102E" stroke-width="3" />
      <path d="M228 77 L248 77" stroke="#C8102E" stroke-width="3" />
      <path d="M180 26 L180 44" stroke="#C8102E" stroke-width="3" />
      <path d="M180 110 L180 124" stroke="#C8102E" stroke-width="3" />
      <text x="96" y="139" class="fill-[#C8102E] text-[10px] font-mono">Gauge · Straightness · Torsion Certified</text>
    `;
  }

  return `${baseGrid}
    <rect x="64" y="44" width="66" height="44" fill="#F1F5F9" stroke="#111111" stroke-width="2.5" />
    <rect x="147" y="44" width="66" height="44" fill="#F1F5F9" stroke="#111111" stroke-width="2.5" />
    <rect x="230" y="44" width="66" height="44" fill="#F1F5F9" stroke="#111111" stroke-width="2.5" />
    <line x1="84" y1="44" x2="84" y2="88" stroke="#C8102E" stroke-width="2.5" />
    <line x1="110" y1="44" x2="110" y2="88" stroke="#C8102E" stroke-width="2.5" />
    <line x1="167" y1="44" x2="167" y2="88" stroke="#C8102E" stroke-width="2.5" />
    <line x1="193" y1="44" x2="193" y2="88" stroke="#C8102E" stroke-width="2.5" />
    <line x1="250" y1="44" x2="250" y2="88" stroke="#C8102E" stroke-width="2.5" />
    <line x1="276" y1="44" x2="276" y2="88" stroke="#C8102E" stroke-width="2.5" />
    <text x="86" y="118" class="fill-[#111111] text-[10.5px] font-mono">TN · KL · KA · AP Scheduled Dispatch</text>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Legacy & Capacity Evolution Explorer (on about.html)
  const milestoneTabs = document.querySelectorAll<HTMLElement>('[data-milestone-idx]');
  const prevBtn = document.getElementById('milestone-prev-btn');
  const nextBtn = document.getElementById('milestone-next-btn');
  const counterEl = document.getElementById('milestone-counter');

  if (milestoneTabs.length > 0) {
    let activeIdx = MILESTONES.length - 1;

    const renderMilestone = (idx: number) => {
      activeIdx = idx;
      const item = MILESTONES[idx];
      if (!item) return;

      const eraEl = document.getElementById('milestone-era');
      const titleEl = document.getElementById('milestone-title');
      const descEl = document.getElementById('milestone-desc');
      const machEl = document.getElementById('milestone-machinery');
      const staffEl = document.getElementById('milestone-staff');
      const outEl = document.getElementById('milestone-output');
      const pctLabel = document.getElementById('milestone-pct-label');
      const pctBar = document.getElementById('milestone-pct-bar');

      if (counterEl) counterEl.textContent = `0${idx + 1} / 0${MILESTONES.length}`;
      if (eraEl) eraEl.textContent = `ERA ${item.year}`;
      if (titleEl) titleEl.textContent = item.title;
      if (descEl) descEl.textContent = item.description;
      if (machEl) machEl.textContent = item.machineryFocus;
      if (staffEl) staffEl.textContent = item.staffCount;
      if (outEl) outEl.textContent = item.monthlyOutput;
      if (pctLabel) pctLabel.textContent = `${item.capacityPercent}% of Current 150+ MT Scale`;
      if (pctBar) pctBar.style.width = `${item.capacityPercent}%`;

      milestoneTabs.forEach((tab) => {
        const selected = Number(tab.dataset.milestoneIdx) === idx;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.classList.toggle('border-[#C8102E]', selected);
        tab.classList.toggle('bg-white', selected);
        tab.classList.toggle('shadow-[0_12px_30px_-14px_rgba(200,16,46,0.28)]', selected);
        tab.classList.toggle('border-slate-200', !selected);

        const yearSpan = tab.querySelector<HTMLElement>('[data-milestone-year]');
        const barEl = tab.querySelector<HTMLElement>('[data-milestone-bar]');
        if (yearSpan) {
          yearSpan.classList.toggle('text-[#C8102E]', selected);
          yearSpan.classList.toggle('text-slate-600', !selected);
        }
        if (barEl) {
          barEl.classList.toggle('bg-[#C8102E]', selected);
          barEl.classList.toggle('bg-slate-300', !selected);
        }
      });
    };

    milestoneTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const i = Number(tab.dataset.milestoneIdx);
        if (!Number.isNaN(i)) renderMilestone(i);
      });
    });

    prevBtn?.addEventListener('click', () => {
      renderMilestone((activeIdx - 1 + MILESTONES.length) % MILESTONES.length);
    });
    nextBtn?.addEventListener('click', () => {
      renderMilestone((activeIdx + 1) % MILESTONES.length);
    });

    renderMilestone(activeIdx);
  }

  // 2. Cold Roll-Forming Production Flow (on index.html & about.html)
  const flowTabs = document.querySelectorAll<HTMLElement>('[data-flow-idx]');
  if (flowTabs.length > 0) {
    const renderFlow = (idx: number) => {
      const flow = PRODUCTION_FLOW_STEPS[idx];
      if (!flow) return;

      const stageBadge = document.getElementById('flow-stage-label');
      const titleEl = document.getElementById('flow-stage-title');
      const descEl = document.getElementById('flow-stage-desc');
      const equipEl = document.getElementById('flow-stage-equipment');
      const tolEl = document.getElementById('flow-stage-tolerance');
      const gateEl = document.getElementById('flow-stage-gate');
      const svgHost = document.getElementById('flow-schematic-svg');

      if (stageBadge) {
        stageBadge.textContent = `STAGE ${flow.step} OF 0${PRODUCTION_FLOW_STEPS.length} · ${flow.tolerance}`;
      }
      if (titleEl) titleEl.textContent = flow.title;
      if (descEl) descEl.textContent = flow.description;
      if (equipEl) equipEl.textContent = flow.equipment;
      if (tolEl) tolEl.textContent = flow.tolerance;
      if (gateEl) gateEl.textContent = flow.qualityGate;
      if (svgHost) svgHost.innerHTML = renderSchematicSvg(flow.stageGeometry);

      flowTabs.forEach((btn) => {
        const active = Number(btn.dataset.flowIdx) === idx;
        btn.classList.toggle('border-[#C8102E]', active);
        btn.classList.toggle('bg-[#C8102E]', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('border-slate-200', !active);
        btn.classList.toggle('bg-[#F8FAFC]', !active);
        btn.classList.toggle('text-[#111111]', !active);

        const numEl = btn.querySelector<HTMLElement>('[data-flow-num]');
        if (numEl) {
          numEl.classList.toggle('text-white/90', active);
          numEl.classList.toggle('text-[#C8102E]', !active);
        }
      });
    };

    flowTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.flowIdx);
        if (!Number.isNaN(i)) renderFlow(i);
      });
    });

    renderFlow(2);
  }
});

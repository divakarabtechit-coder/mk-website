import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PlantBayId, PlantStructureCanvas } from '../r3f/PlantStructureCanvas';

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('plant-3d-mount');
  if (!mount) return;

  const bayCards = document.querySelectorAll<HTMLElement>('[data-plant-bay]');
  const bayTabs = document.querySelectorAll<HTMLElement>('[data-plant-tab]');
  const activeLabelEl = document.getElementById('plant-active-bay-label');

  const BAY_LABELS: Record<PlantBayId, string> = {
    'bay-01': 'Bay 01 · Continuous Cold Roll-Forming Mills',
    'bay-02': 'Bay 02 · Rotary Coil Slitting & Flying Shear',
    'bay-03': 'Bay 03 · Mechanical Punch Presses & Custom Dies',
    'bay-04': 'Bay 04 · Overhead Crane & Sheltered GI Coil Rack',
    'bay-05': 'Bay 05 · Integrated QC Lab & 4-State Dispatch',
  };

  let activeBay: PlantBayId | null = null;
  let root: Root | null = null;

  try {
    root = createRoot(mount);
  } catch {
    return;
  }

  const syncUI = () => {
    if (activeLabelEl) {
      activeLabelEl.textContent = activeBay
        ? BAY_LABELS[activeBay]
        : 'Overview · Keeranatham 5-Bay Plant Floorplan';
    }

    bayTabs.forEach((tab) => {
      const val = tab.dataset.plantTab;
      const selected = (val === 'overview' && activeBay === null) || val === activeBay;
      tab.classList.toggle('bg-[#C8102E]', selected);
      tab.classList.toggle('text-white', selected);
      tab.classList.toggle('border-[#C8102E]', selected);
      tab.classList.toggle('bg-white', !selected);
      tab.classList.toggle('text-[#111111]', !selected);
      tab.classList.toggle('border-slate-200', !selected);
    });

    bayCards.forEach((card) => {
      const bay = card.dataset.plantBay as PlantBayId | undefined;
      const selected = bay === activeBay;
      card.classList.toggle('border-[#C8102E]', selected);
      card.classList.toggle('ring-2', selected);
      card.classList.toggle('ring-[#C8102E]/15', selected);
      if (!selected && bay !== 'bay-05') {
        card.classList.add('border-slate-200');
      }
    });
  };

  const selectBay = (bay: PlantBayId | null) => {
    activeBay = bay;
    syncUI();
    root?.render(
      React.createElement(PlantStructureCanvas, {
        activeBay,
        onSelectBay: (b: PlantBayId) => selectBay(b),
      })
    );
  };

  bayTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const val = tab.dataset.plantTab;
      selectBay(val === 'overview' || !val ? null : (val as PlantBayId));
    });
  });

  bayCards.forEach((card) => {
    card.addEventListener('click', () => {
      const bay = card.dataset.plantBay as PlantBayId | undefined;
      if (bay) selectBay(bay);
    });
  });

  selectBay(null);

  window.addEventListener('beforeunload', () => {
    root?.unmount();
  });
});

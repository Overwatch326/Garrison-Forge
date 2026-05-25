// Simple static CRL configs + helpers for the standalone build-thread tool.
// This is intentionally tiny and local-only.

(function () {
  const CRL_CONFIG = {
    tk: {
      label: 'Stormtrooper (TK) – Starter Checklist',
      items: [
        { id: 'helmet', label: 'Helmet' },
        { id: 'chest', label: 'Chest Plate' },
        { id: 'back', label: 'Back Plate' },
        { id: 'abdomen', label: 'Abdomen / Kidney / Butt' },
        { id: 'arms', label: 'Shoulders / Biceps / Forearms' },
        { id: 'legs', label: 'Thighs / Shins / Knees' },
        { id: 'belt', label: 'Belt & Drop Boxes' },
        { id: 'undersuit', label: 'Undersuit / Gloves / Neckseal' },
        { id: 'boots', label: 'Boots' },
        { id: 'weapons', label: 'Blaster / Holster' },
      ],
    },
    ti: {
      label: 'TIE Pilot (TI) – Starter Checklist',
      items: [
        { id: 'helmet', label: 'Helmet' },
        { id: 'flightsuit', label: 'Flightsuit' },
        { id: 'chestbox', label: 'Chestbox / Hoses' },
        { id: 'armor', label: 'Chest / Back / Shoulder Armor' },
        { id: 'belt', label: 'Belt & Boxes' },
        { id: 'gloves', label: 'Gloves' },
        { id: 'boots', label: 'Boots' },
      ],
    },
  };

  function normalizeType(s) {
    if (!s) return '';
    return String(s).trim().toLowerCase();
  }

  function getConfigForType(costumeType) {
    const norm = normalizeType(costumeType);
    if (!norm) return null;
    if (norm.includes('stormtrooper') || norm === 'tk' || norm.startsWith('tk ')) return CRL_CONFIG.tk;
    if (norm.includes('tie') || norm === 'ti' || norm.startsWith('ti ')) return CRL_CONFIG.ti;
    return null;
  }

  window.Crl = {
    getConfigForType,
  };
})();

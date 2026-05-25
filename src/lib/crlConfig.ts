export type CrlStatus = 'planned' | 'in-progress' | 'done';

export interface CrlItem {
  id: string;
  label: string;
}

export interface CrlDefinition {
  label: string;
  items: CrlItem[];
}

// Very small starter CRL config. In a real deployment this would be editable
// per garrison / costume type, but config-based is fine for v1.
export const CRL_CONFIG: Record<string, CrlDefinition> = {
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

export function getCrlForCostumeType(costumeType?: string | null): CrlDefinition | null {
  if (!costumeType) return null;

  const normalized = costumeType.trim().toLowerCase();
  if (normalized.includes('tk') || normalized.includes('stormtrooper')) return CRL_CONFIG.tk;
  if (normalized.includes('ti') || normalized.includes('tiepilot') || normalized.includes('tie pilot')) {
    return CRL_CONFIG.ti;
  }

  return null;
}

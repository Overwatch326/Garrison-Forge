export interface AppBranding {
  primaryLogoUrl: string; // main garrison logo (e.g. wordmark)
  secondaryLogoUrl?: string; // optional badge / mark
}

export interface GarrisonInfo {
  name: string;
  forumUrl?: string;
  threadHeader?: string;
}

export type ThemeId =
  | 'night-ops'
  | 'hangar-bay'
  | 'briefing-room'
  | 'command-bridge'
  | 'clone-rex'
  | 'darth-maul'
  | 'boba-fett';

export interface AppConfig {
  branding: AppBranding;
  garrison: GarrisonInfo;
  theme: ThemeId;
}

const STORAGE_KEY = 'garrison-forge-app-config-v1';

const DEFAULT_BRANDING: AppBranding = {
  primaryLogoUrl: '/assets/garrison-forge-wordmark.svg',
  secondaryLogoUrl: '/assets/garrison-forge-mark.svg',
};

const DEFAULT_GARRISON: GarrisonInfo = {
  name: 'Your Garrison',
  forumUrl: '',
  threadHeader: '',
};

const DEFAULT_CONFIG: AppConfig = {
  branding: DEFAULT_BRANDING,
  garrison: DEFAULT_GARRISON,
  theme: 'night-ops',
};

function loadConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      branding: {
        ...DEFAULT_BRANDING,
        ...(parsed.branding || {}),
      },
      garrison: {
        ...DEFAULT_GARRISON,
        ...(parsed.garrison || {}),
      },
      theme: parsed.theme ?? 'night-ops',
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(cfg: AppConfig) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

let config: AppConfig = DEFAULT_CONFIG;

if (typeof window !== 'undefined') {
  config = loadConfig();
}

export const AppConfigStore = {
  getConfig(): AppConfig {
    return config;
  },

  getBranding(): AppBranding {
    return config.branding;
  },

  getGarrison(): GarrisonInfo {
    return config.garrison;
  },

  getTheme(): ThemeId {
    return config.theme;
  },

  updateBranding(patch: Partial<AppBranding>): AppBranding {
    config = {
      ...config,
      branding: {
        ...config.branding,
        ...patch,
      },
    };
    saveConfig(config);
    return config.branding;
  },

  updateGarrison(patch: Partial<GarrisonInfo>): GarrisonInfo {
    config = {
      ...config,
      garrison: {
        ...config.garrison,
        ...patch,
      },
    };
    saveConfig(config);
    return config.garrison;
  },

  updateTheme(theme: ThemeId): ThemeId {
    config = {
      ...config,
      theme,
    };
    saveConfig(config);
    return config.theme;
  },
};

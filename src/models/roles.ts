export type RoleId = "admin" | "member" | string;

export type PermissionId =
  | "events.create"
  | "events.manage" // edit/delete
  | "events.view_signups" // see full signup rosters
  | "projects.create"
  | "projects.manage";

export interface Permission {
  id: PermissionId;
  label: string;
  description?: string;
}

export const allPermissions: Permission[] = [
  {
    id: "events.create",
    label: "Create events",
    description: "Can create new troop calendar events.",
  },
  {
    id: "events.manage",
    label: "Manage events",
    description: "Can edit and delete events.",
  },
  {
    id: "events.view_signups",
    label: "View all event signups",
    description: "Can see full signup rosters for events.",
  },
  {
    id: "projects.create",
    label: "Create projects",
  },
  {
    id: "projects.manage",
    label: "Manage all projects",
  },
];

export interface Role {
  id: RoleId;
  label: string;
  description?: string;
  level: number; // higher = more powerful
  system?: boolean; // built-in, not deletable
  permissions?: PermissionId[];
}

export const defaultRoles: Record<string, Role> = {
  admin: {
    id: "admin",
    label: "Admin",
    description: "Global administrative access to all projects and settings.",
    level: 100,
    system: true,
    permissions: allPermissions.map((p) => p.id),
  },
  member: {
    id: "member",
    label: "Member",
    description: "Standard member with access to their own projects and shared threads.",
    level: 10,
    system: true,
    permissions: ["projects.create"],
  },
};

export interface RoleState {
  roles: Role[];
}

const STORAGE_KEY = "garrison-forge-roles-v1";

function loadRoleState(): RoleState {
  if (typeof window === "undefined") return { roles: Object.values(defaultRoles) };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { roles: Object.values(defaultRoles) };
    const parsed = JSON.parse(raw) as RoleState;
    if (!parsed.roles || parsed.roles.length === 0) {
      return { roles: Object.values(defaultRoles) };
    }
    // Merge any new permissions into existing roles without losing custom ones
    return {
      roles: parsed.roles.map((r) => ({
        ...r,
        permissions: r.permissions ?? [],
      })),
    };
  } catch {
    return { roles: Object.values(defaultRoles) };
  }
}

function saveRoleState(state: RoleState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let roleState: RoleState = { roles: Object.values(defaultRoles) };
if (typeof window !== "undefined") {
  roleState = loadRoleState();
}

export function createInitialRoleState(): RoleState {
  return roleState;
}

export const RolesStore = {
  getState(): RoleState {
    return roleState;
  },
  setState(next: RoleState) {
    roleState = next;
    saveRoleState(roleState);
  },
};

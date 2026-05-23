export type RoleId = "admin" | "member" | string;

export interface Role {
  id: RoleId;
  label: string;
  description?: string;
  level: number; // higher = more powerful
  system?: boolean; // built-in, not deletable
}

export const defaultRoles: Record<string, Role> = {
  admin: {
    id: "admin",
    label: "Admin",
    description: "Global administrative access to all projects and settings.",
    level: 100,
    system: true,
  },
  member: {
    id: "member",
    label: "Member",
    description: "Standard member with access to their own projects and shared threads.",
    level: 10,
    system: true,
  },
};

export interface RoleState {
  roles: Role[];
}

export function createInitialRoleState(): RoleState {
  return {
    roles: Object.values(defaultRoles),
  };
}

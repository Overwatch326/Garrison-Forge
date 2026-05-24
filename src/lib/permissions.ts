import type { Role, PermissionId } from '../models/roles';

export function roleHasPermission(role: Role, perm: PermissionId): boolean {
  if (!role) return false;
  if (role.id === 'admin') return true; // safety: admin always allowed
  const set = new Set(role.permissions ?? []);
  return set.has(perm);
}

// Only server-managed app_metadata may grant staff access. Never trust user_metadata.
export function canAccessStaffArea(user, area) {
  const role = user?.app_metadata?.staff_role;
  if (!user?.id) return false;
  if (area === 'admin') return role === 'owner' || role === 'admin';
  if (area === 'warehouse') return ['owner', 'admin', 'warehouse'].includes(role);
  return false;
}

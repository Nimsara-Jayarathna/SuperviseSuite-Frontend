export const ROLES = {
  SUPERVISOR: 'SUPERVISOR',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
export type UserRoleLower = Lowercase<UserRole>;
export type RoleInput = UserRole | UserRoleLower;

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.STUDENT]: 'Student',
};

export function normalizeUserRole(role: RoleInput): UserRole {
  return role.toUpperCase() === ROLES.SUPERVISOR ? ROLES.SUPERVISOR : ROLES.STUDENT;
}

export function getRoleLabel(role: RoleInput, uppercase = false): string {
  const label = ROLE_LABELS[normalizeUserRole(role)];
  return uppercase ? label.toUpperCase() : label;
}

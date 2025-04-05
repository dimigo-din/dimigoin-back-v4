import { numberPermission } from "../utils/permission.util";

export const UserPermissionValues = [
  "MANAGE_OAUTH_CLIENT_SELF",
  "MANAGE_STAY",
  "VIEW_STAY",
] as const;

export const ManagementPermissionValues = ["MANAGE_PERMISSION"] as const;

// Merge permission values without duplicates
export const PermissionValues = [
  ...new Set([...UserPermissionValues, ...ManagementPermissionValues]),
] as const;
export type PermissionType = (typeof PermissionValues)[number];

// Create enum for easy permission management with binary
export const PermissionEnum = Object.fromEntries(
  PermissionValues.map((v: PermissionType, i) => [v, Math.pow(2, i++)]),
) as { [key in PermissionType]: number };

// group of well-used permissions
export const StudentUserPermission: number[] = [PermissionEnum.MANAGE_OAUTH_CLIENT_SELF];
export const TeacherUserPermission: number[] = [
  ...StudentUserPermission,
  PermissionEnum.MANAGE_STAY,
];
export const AdminUserPermission: number[] = Object.values(PermissionEnum);

export const PermissionGroups = {
  StudentUserPermission,
  TeacherUserPermission,
  AdminUserPermission,
};
export const NumberedPermissionGroupsEnum = Object.fromEntries(
  Object.keys(PermissionGroups).map((v) => [v, numberPermission(...PermissionGroups[v])]),
) as { [key in string]: number };

import { numberPermission } from "../utils/permission.util";

export const UserPermissionValues = ["STUDENT", "TEACHER"] as const;

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
export const StudentUserPermission: number[] = [PermissionEnum.STUDENT];
export const TeacherUserPermission: number[] = [PermissionEnum.TEACHER];
export const AdminUserPermission: number[] = Object.values(PermissionEnum);

export const PermissionGroups = {
  StudentUserPermission,
  TeacherUserPermission,
  AdminUserPermission,
};
export const NumberedPermissionGroupsEnum = Object.fromEntries(
  Object.keys(PermissionGroups).map((v) => [
    v,
    numberPermission(...PermissionGroups[v as keyof typeof PermissionGroups]),
  ]),
) as { [key in string]: number };

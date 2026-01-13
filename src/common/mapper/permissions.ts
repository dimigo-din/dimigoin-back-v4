export const UserPermissionValues = ["STUDENT", "TEACHER"] as const;

export const ManagementPermissionValues = ["MANAGE_PERMISSION"] as const;

// Merge permission values without duplicates
export const PermissionValues = [
  ...new Set([...UserPermissionValues, ...ManagementPermissionValues]),
] as const;
export type PermissionType = (typeof PermissionValues)[number];

// Create enum for easy permission management with binary
export const PermissionEnum = Object.fromEntries(
  PermissionValues.map((v: PermissionType, i) => [v, 2 ** i++]),
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

let _cachedNumberedPermissionGroupsEnum: { [key in string]: number } | null = null;

export const getNumberedPermissionGroupsEnum = (): { [key in string]: number } => {
  if (!_cachedNumberedPermissionGroupsEnum) {
    _cachedNumberedPermissionGroupsEnum = Object.fromEntries(
      Object.keys(PermissionGroups).map((v) => [
        v,
        PermissionGroups[v as keyof typeof PermissionGroups].reduce((acc, cur) => acc | cur, 0),
      ]),
    ) as { [key in string]: number };
  }
  return _cachedNumberedPermissionGroupsEnum;
};

export const NumberedPermissionGroupsEnum = new Proxy({} as { [key in string]: number }, {
  get(_target, prop) {
    return getNumberedPermissionGroupsEnum()[prop as string];
  },
  ownKeys() {
    return Object.keys(getNumberedPermissionGroupsEnum());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return {
      enumerable: true,
      configurable: true,
      value: getNumberedPermissionGroupsEnum()[prop as string],
    };
  },
});

import { PermissionEnum, PermissionType } from "$mapper/permissions";

export const numberPermission = (...items: (number | PermissionType)[]): number => {
  let val = 0;
  for (const item of items) {
    const flag = typeof item === "number" ? item : (PermissionEnum[item] ?? 0);
    val |= flag;
  }
  return val;
};

const cachedEntries = Object.entries(PermissionEnum) as [PermissionType, number][];

export const parsePermission = (
  numberedPermission: number | string,
  customPermissionEnum?: Record<string, number>,
): PermissionType[] => {
  const num =
    typeof numberedPermission === "string" ? parseInt(numberedPermission, 10) : numberedPermission;

  const entries = customPermissionEnum ? Object.entries(customPermissionEnum) : cachedEntries;

  const permissions: PermissionType[] = [];
  for (const [key, value] of entries) {
    if ((num & value) === value && value !== 0) {
      permissions.push(key as PermissionType);
    }
  }
  return permissions;
};

export const hasPermission = (
  currentPermission: number | string,
  requiredPermission: number[],
  or = false,
): boolean => {
  const current =
    typeof currentPermission === "string" ? parseInt(currentPermission, 10) : currentPermission;

  const required = numberPermission(...requiredPermission);

  return or ? (current & required) !== 0 : (current & required) === required;
};

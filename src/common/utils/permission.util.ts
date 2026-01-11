import { PermissionEnum, PermissionType } from "../mapper/permissions";

export const numberPermission = (...items: number[] | PermissionType[]): number => {
  let val = 0;
  const valList = [];
  for (const item of items) {
    let fixedItem: number;
    if (typeof item !== "number") {
      fixedItem = PermissionEnum[item] || 0;
    } else {
      fixedItem = item;
    }
    if (valList.indexOf(fixedItem) !== -1) {
      continue;
    }
    val += fixedItem;
    valList.push(item);
  }

  return val;
};

export const parsePermission = (
  numberedPermission: number | string,
  customPermissionEnum?: { [key: string]: number },
): PermissionType[] => {
  if (typeof numberedPermission === "string") {
    numberedPermission = parseInt(numberedPermission, 10);
  }

  const permissionEnum = customPermissionEnum || PermissionEnum;

  const permissions: PermissionType[] = [];
  for (const permission of Object.values(permissionEnum).sort((a, b) => b - a)) {
    if (numberedPermission - permission >= 0) {
      numberedPermission = numberedPermission - permission;
      permissions.push(
        Object.keys(permissionEnum).find(
          (p) => (permissionEnum as Record<string, number>)[p] === permission,
        ) as PermissionType,
      );
    }
  }

  return permissions;
};

export const hasPermission = (
  currentPermission: number | string,
  requiredPermission: number[],
  or: boolean = false,
) => {
  if (typeof currentPermission === "string") {
    currentPermission = parseInt(currentPermission, 10);
  }

  const currentPermissionList = parsePermission(currentPermission);
  // TODO: Optimise
  const requiredPermissionList = parsePermission(numberPermission(...requiredPermission));

  return or
    ? requiredPermissionList.some(
        (rp) => currentPermissionList.indexOf(rp as PermissionType) !== -1,
      )
    : requiredPermissionList.every(
        (rp) => currentPermissionList.indexOf(rp as PermissionType) !== -1,
      );
};

export const GradeValues = [1, 2, 3] as const;

export const ClassValues = [1, 2, 3, 4, 5, 6] as const;

export const GenderValues = ['M', 'F'] as const;

// A = Admin, T = Teacher, D = Domitory
export const PositionValues = ['A', 'T', 'D'] as const;

export const StatusValues = ['A', 'R', 'W']; // Accepted, Rejected, Waiting

export const WasherValues = [
  'F1',
  'F2',
  'F3',
  'M2L',
  'M2M',
  'M2R',
  'M4L',
  'M4R',
  'M5',
] as const; // Ex: Female-1층 = F1, Male-2층-오른쪽 = M2R

export interface refreshTokenVerified {
  refreshToken: string;
  userId: string;
}

// TBD: 다른 권한 필요시 추가
export interface Permissions {
  view: string[];
  edit: string[];
}

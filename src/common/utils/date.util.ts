const DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const DayNumber2String = (day: number): string => {
  if (day < 0 || day > 6) {
    throw Error("Invalid Range.");
  }
  return DAYS[day] ?? "Invalid Day";
};

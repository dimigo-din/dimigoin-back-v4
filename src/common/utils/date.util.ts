export const DayNumber2String = (day: number): string => {
  if (day === 0) {
    return "일";
  }
  if (day === 1) {
    return "월";
  }
  if (day === 2) {
    return "화";
  }
  if (day === 3) {
    return "수";
  }
  if (day === 4) {
    return "목";
  }
  if (day === 5) {
    return "금";
  }
  if (day === 6) {
    return "토";
  }
  throw Error("Invalid Range.");
};

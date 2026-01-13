import { VALID_STAY_SEAT_RANGES } from "$mapper/constants";

const parseCell = (cell: string) => {
  const match = cell.match(/^([A-Z])(\d+)$/i);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid cell format: ${cell}`);
  }
  return { col: match[1].toUpperCase().charCodeAt(0), row: parseInt(match[2], 10) };
};

export const isInValidRange = (target: string): boolean => {
  return VALID_STAY_SEAT_RANGES.some(([start, end]) => {
    return isInRange([start, end], target);
  });
};

export const isInRange = (range: string[], target: string): boolean => {
  if (range.length !== 2 || !range[0] || !range[1]) {
    throw new Error("Range must contain exactly 2 elements");
  }

  const a = parseCell(range[0]);
  const b = parseCell(range[1]);
  const t = parseCell(target);

  const minCol = Math.min(a.col, b.col);
  const maxCol = Math.max(a.col, b.col);
  const minRow = Math.min(a.row, b.row);
  const maxRow = Math.max(a.row, b.row);

  return minCol <= t.col && t.col <= maxCol && minRow <= t.row && t.row <= maxRow;
};

export const generateValidRange = (): string[] => {
  const result: string[] = [];

  for (const [start, end] of VALID_STAY_SEAT_RANGES) {
    const s = parseCell(start);
    const e = parseCell(end);

    for (let c = Math.min(s.col, e.col); c <= Math.max(s.col, e.col); c++) {
      for (let r = Math.min(s.row, e.row); r <= Math.max(s.row, e.row); r++) {
        result.push(String.fromCharCode(c) + r);
      }
    }
  }

  return result;
};

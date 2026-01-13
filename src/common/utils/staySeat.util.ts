const parseCell = (cell: string) => {
  const match = cell.match(/^([A-Z]+)(\d+)$/i);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid cell format: ${cell}`);
  }
  return { col: match[1].toUpperCase(), row: parseInt(match[2], 10) };
};

const compareCol = (a: string, b: string): number => a.localeCompare(b) || a.length - b.length;

export const alignRange = (range: string[]): [string, string] => {
  if (range.length !== 2 || !range[0] || !range[1]) {
    throw new Error("Range must contain exactly 2 elements");
  }

  const c1 = parseCell(range[0]);
  const c2 = parseCell(range[1]);

  const minCol = compareCol(c1.col, c2.col) <= 0 ? c1.col : c2.col;
  const maxCol = compareCol(c1.col, c2.col) > 0 ? c1.col : c2.col;
  const minRow = Math.min(c1.row, c2.row);
  const maxRow = Math.max(c1.row, c2.row);

  return [`${minCol}${minRow}`, `${maxCol}${maxRow}`];
};

export const isInRange = (range: string[], target: string): boolean => {
  const [startStr, endStr] = alignRange(range);
  const start = parseCell(startStr);
  const end = parseCell(endStr);
  const t = parseCell(target);

  return (
    compareCol(start.col, t.col) <= 0 &&
    compareCol(t.col, end.col) <= 0 &&
    start.row <= t.row &&
    t.row <= end.row
  );
};

export const generateRange = (range: string[]): string[] => {
  const [startStr, endStr] = alignRange(range);
  const start = parseCell(startStr);
  const end = parseCell(endStr);
  const result: string[] = [];

  for (let c = start.col.charCodeAt(0); c <= end.col.charCodeAt(0); c++) {
    for (let r = start.row; r <= end.row; r++) {
      result.push(String.fromCharCode(c) + r);
    }
  }

  return result;
};

export const countArray = (...arrays: unknown[][]): number => {
  return arrays.reduce((a: number, c: unknown[]) => a + c.length, 0);
};

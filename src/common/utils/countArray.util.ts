export const countArray = (...arrays: any[]) => {
  return arrays.reduce((a: number, c: any[]) => a + c.length, 0);
};

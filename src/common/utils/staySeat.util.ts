export const alignRange = (range: string[]): [string, string] => {
  const [range1, range2] = range;
  if (!range1 || !range2) {
    throw new Error("Range must contain exactly 2 elements");
  }
  const range1Detail = [range1.charAt(0), range1.slice(1)] as const;
  const range2Detail = [range2.charAt(0), range2.slice(1)] as const;
  return [
    `${range1Detail[0].charCodeAt(0) > range2Detail[0].charCodeAt(0) ? range2Detail[0] : range1Detail[0]}${parseInt(range1Detail[1], 10) > parseInt(range2Detail[1], 10) ? parseInt(range2Detail[1], 10) : parseInt(range1Detail[1], 10)}`,
    `${range1Detail[0].charCodeAt(0) <= range2Detail[0].charCodeAt(0) ? range2Detail[0] : range1Detail[0]}${parseInt(range1Detail[1], 10) <= parseInt(range2Detail[1], 10) ? parseInt(range2Detail[1], 10) : parseInt(range1Detail[1], 10)}`,
  ];
};

export const isInRange = (range: string[], target: string): boolean => {
  const [range1, range2] = alignRange(range);
  const range1Detail = [range1.charCodeAt(0), range1.slice(1)] as const;
  const range2Detail = [range2.charCodeAt(0), range2.slice(1)] as const;
  const targetDetail = [target.charCodeAt(0), target.slice(1)] as const;

  return (
    range1Detail[0] <= targetDetail[0] &&
    targetDetail[0] <= range2Detail[0] &&
    parseInt(range1Detail[1], 10) <= parseInt(targetDetail[1], 10) &&
    parseInt(targetDetail[1], 10) <= parseInt(range2Detail[1], 10)
  );
};

export const generateRange = (range: string[]): string[] => {
  const arr: string[] = [];
  const [start, end] = alignRange(range);
  const startDetail = [start.charAt(0), start.slice(1)] as const;
  const endDetail = [end.charAt(0), end.slice(1)] as const;

  for (let i = startDetail[0].charCodeAt(0); i <= endDetail[0].charCodeAt(0); i++) {
    for (let j = parseInt(startDetail[1], 10); j <= parseInt(endDetail[1], 10); j++) {
      arr.push(String.fromCharCode(i) + j.toString());
    }
  }
  return arr;
};

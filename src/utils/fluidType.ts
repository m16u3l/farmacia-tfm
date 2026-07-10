export function fluidFontSize(
  minRem: number,
  maxRem: number,
  minVw = 375,
  maxVw = 1536
): string {
  const slope = (maxRem - minRem) / (maxVw - minVw);
  const intersection = minRem - slope * minVw;
  return `clamp(${minRem}rem, ${intersection.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxRem}rem)`;
}

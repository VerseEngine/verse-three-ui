export function findLastIndex<T>(
  ar: Array<T>,
  cond: (v: T) => boolean
): number {
  for (let i = ar.length - 1; i >= 0; i--) {
    if (cond(ar[i])) {
      return i;
    }
  }
  return -1;
}

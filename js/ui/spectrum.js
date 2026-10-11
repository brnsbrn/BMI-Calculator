/** Equal-width category bands with a marker interpolated inside each band. */
export function spectrumPosition(value, ranges) {
  const index = ranges.findIndex(range => value < range.max);
  if (index < 0) return 100;
  const range = ranges[index];
  const fraction = Math.min(1, Math.max(0, (value - range.min) / (range.max - range.min)));
  return ((index + fraction) / ranges.length) * 100;
}

/**
 * @summary: Display formated seconds
 * @param seconds
 * @returns formated string
 */
export function formatSeconds(seconds: number) {
  function padZero(v: number) {
    return v < 10 ? '0' + v : v;
  }
  const sec = Math.floor(seconds % 60);
  const min = Math.floor((seconds / 60) % 60);
  const hr = Math.floor(seconds / 60 / 60);
  // Example: 1:06:58 or 18:50 or 03:45
  return seconds ? hr + ':' : '' + padZero(time ? min : 0) + ':' + padZero(time ? sec : 0);
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

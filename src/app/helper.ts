/**
 * @summary: Display formated seconds
 * @param seconds
 * @returns formated string
 */
export function formatSeconds(seconds: number) {
  let isNegative = false;

  if (seconds < 0) {
    isNegative = true;
    seconds = Math.abs(seconds);
  }

  const sec = Math.floor(seconds % 60);
  const min = Math.floor((seconds / 60) % 60);
  const hr = Math.floor(seconds / 60 / 60);
  // Example: 1:06:58 or 18:50 or 03:45
  let time = '';
  time += hr > 0 ? hr.toString() + ':' : '';
  time += hr > 0 ? min.toString().padStart(2, '0') + ':' : min.toString() + ':';
  time += sec.toString().padStart(2, '0');

  return isNegative ? `-${time}` : time;
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * @summary: Truncate a string and add ellipsis
 * https://stackoverflow.com/questions/1199352/smart-way-to-truncate-long-strings
 * @param str
 * @param n
 * @returns str
 */
export const truncate = (str: string, n: number): string => {
  return str.length > n ? str.slice(0, n - 1) + '&hellip;' : str;
};

export const displayDuration = (time: number) => {
  function padZero(v: number) {
    return v < 10 ? '0' + v : v;
  }
  const sec = Math.round(time % 60);
  const min = Math.round((time / 60) % 60);
  const hr = Math.round((time / (60 * 60)) % 24);
  // Example: 1:06:58 or 18:50 or 03:45
  return time ? hr + ':' : '' + padZero(time ? min : 0) + ':' + padZero(time ? sec : 0);
};

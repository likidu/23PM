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

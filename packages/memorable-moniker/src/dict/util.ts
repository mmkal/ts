export const split = (multiLineString: string) =>
  multiLineString
    .trim()
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

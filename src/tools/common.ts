export function addFlag(args: string[], flag: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === false) return;
  args.push(flag);
  if (value !== true) args.push(String(value));
}

export function addListFlag(args: string[], flag: string, values: readonly string[] | undefined): void {
  if (!values?.length) return;
  args.push(flag, values.join(","));
}

export function validateHttpUrl(value: string, label = "url"): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid absolute URL.`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} must use http or https.`);
  }
}

export function warningCount(stderr: string): number {
  return stderr.split(/\r?\n/).filter((line) => /^warn:/i.test(line.trim())).length;
}

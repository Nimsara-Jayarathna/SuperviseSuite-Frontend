export function clearRecord(record: Partial<Record<string, unknown>>): void {
  for (const key of Object.keys(record)) {
    delete record[key];
  }
}

export function appendQuery(url: string, params: URLSearchParams): string {
  const query = params.toString();
  if (!query) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

export function deleteKeysWithPrefix(
  record: Partial<Record<string, unknown>>,
  prefix: string,
): void {
  for (const key of Object.keys(record)) {
    if (key.startsWith(prefix)) {
      delete record[key];
    }
  }
}

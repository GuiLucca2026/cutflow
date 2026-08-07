// Mirrors the `basePath` set in next.config.ts. Needed for raw fetch()
// calls, which — unlike next/link and next/navigation — are NOT
// automatically prefixed by Next.js's basePath handling.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  return `${BASE_PATH}${path}`;
}

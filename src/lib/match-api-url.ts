/**
 * Resolve the match endpoint.
 *
 * Same-origin `/api/match` (with optional GitHub Pages basePath) is used for
 * `next start` / local dev. Production Pages builds set
 * NEXT_PUBLIC_MATCH_API_BASE to the Actions-deployed Node API origin so the
 * TypeSafe key never ships in the static bundle.
 */
export function getMatchApiUrl(): string {
  const external = process.env.NEXT_PUBLIC_MATCH_API_BASE?.replace(/\/$/, "");
  if (external) {
    return `${external}/api/match`;
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
  return `${basePath}/api/match`;
}

import { handleMatchRequest } from "@/lib/handle-match";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleMatchRequest(request);
}

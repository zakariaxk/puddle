import { getRadarNowcast } from "@/lib/radar";

export const dynamic = "force-dynamic";

export async function GET() {
  const nowcast = await getRadarNowcast();
  return Response.json(nowcast, { headers: { "Cache-Control": "private, max-age=60, s-maxage=120" } });
}

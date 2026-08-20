import { getRadarSnapshot } from "@/lib/radar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getRadarSnapshot();
    return Response.json(snapshot, { headers: { "Cache-Control": "private, max-age=60, s-maxage=120" } });
  } catch {
    return Response.json({ error: "Live radar is temporarily unavailable. Try again shortly." }, { status: 503 });
  }
}

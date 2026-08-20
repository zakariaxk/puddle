import { isCentralFloridaCoordinate } from "@/lib/location";
import { getForecastHistory, isPersistenceConfigured } from "@/lib/persistence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("longitude"));
  if (!isCentralFloridaCoordinate(latitude, longitude)) {
    return Response.json({ error: "Choose a point within Central Florida." }, { status: 400 });
  }
  if (!isPersistenceConfigured()) return Response.json({ history: [], persistence: "unavailable" });

  try {
    return Response.json({ history: await getForecastHistory(latitude, longitude), persistence: "available" });
  } catch {
    return Response.json({ history: [], persistence: "unavailable" });
  }
}

import { createConsumerForecast } from "@/lib/forecast";
import { applyPuddleModel } from "@/lib/ml-inference";
import { loadProductionPuddleModel } from "@/lib/ml-model";
import { recordForecast } from "@/lib/persistence";
import { getNwsWeatherSnapshot } from "@/lib/weather/nws";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return Response.json({ error: "Provide valid latitude and longitude query parameters." }, { status: 400 });
  }
  try {
    const snapshot = await getNwsWeatherSnapshot(latitude, longitude);
    const baseForecast = createConsumerForecast(snapshot);
    const artifact = await loadProductionPuddleModel();
    const forecast = artifact ? applyPuddleModel(baseForecast, snapshot, artifact) : baseForecast;
    try {
      await recordForecast({ forecast });
    } catch {
      // Persistence is optional for anonymous forecasts and must never hide live guidance.
    }
    return Response.json(forecast, { headers: { "Cache-Control": "private, max-age=60, s-maxage=300" } });
  } catch (error) {
    const message = error instanceof RangeError ? error.message : "Live weather sources are temporarily unavailable. Try again shortly.";
    return Response.json({ error: message }, { status: error instanceof RangeError ? 400 : 503 });
  }
}

import { GeocodingError, searchCentralFloridaLocations } from "@/lib/geocoding";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    return Response.json({ results: await searchCentralFloridaLocations(query) }, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" },
    });
  } catch (error) {
    const message = error instanceof GeocodingError
      ? error.message
      : "Location search is temporarily unavailable. Try again in a moment.";
    return Response.json({ error: message }, { status: 400 });
  }
}

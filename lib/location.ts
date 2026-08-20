export const CENTRAL_FLORIDA_BOUNDS = {
  west: -82.05,
  south: 27.45,
  east: -80.35,
  north: 29.2,
} as const;

export type LocationSelection = {
  name: string;
  latitude: number;
  longitude: number;
};

export type GeocodingResult = LocationSelection & {
  id: string;
};

type NominatimPlace = {
  display_name?: string;
  lat?: string;
  lon?: string;
  place_id?: number;
};

export function isCentralFloridaCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= CENTRAL_FLORIDA_BOUNDS.south
    && latitude <= CENTRAL_FLORIDA_BOUNDS.north
    && longitude >= CENTRAL_FLORIDA_BOUNDS.west
    && longitude <= CENTRAL_FLORIDA_BOUNDS.east;
}

export function locationNameForCoordinate(latitude: number, longitude: number) {
  return `Selected point (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
}

export function normalizeGeocodingResults(places: NominatimPlace[]): GeocodingResult[] {
  return places.flatMap((place) => {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);

    if (!place.display_name || !isCentralFloridaCoordinate(latitude, longitude)) {
      return [];
    }

    return [{
      id: String(place.place_id ?? `${latitude},${longitude}`),
      name: place.display_name,
      latitude,
      longitude,
    }];
  });
}

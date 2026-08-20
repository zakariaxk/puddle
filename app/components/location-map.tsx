"use client";

import { useEffect, useRef, useState } from "react";
import type { LocationSelection } from "@/lib/location";
import type { RadarSnapshot } from "@/lib/radar";
import type { RadarNowcast } from "@/lib/nowcast";

type LocationMapProps = {
  selection: LocationSelection | null;
  probabilityPercent: number | null;
  onSelect: (location: LocationSelection) => void;
  radar: RadarSnapshot | null;
  nowcast: RadarNowcast | null;
  radarError: string | null;
  onRetryRadar: () => void;
};

const radarSourceId = "puddle-radar";
const radarLayerId = "puddle-radar-layer";
const projectionSourceId = "puddle-nowcast-projection";
const projectionLayerId = "puddle-nowcast-projection-layer";

function applyRadarFrame(map: import("maplibre-gl").Map, tileUrl: string | null) {
  if (map.getLayer(radarLayerId)) map.removeLayer(radarLayerId);
  if (map.getSource(radarSourceId)) map.removeSource(radarSourceId);
  if (!tileUrl) return;
  map.addSource(radarSourceId, { type: "raster", tiles: [tileUrl], tileSize: 256, maxzoom: 7 });
  map.addLayer({ id: radarLayerId, type: "raster", source: radarSourceId, paint: { "raster-opacity": 0.72, "raster-fade-duration": 180 } });
}

function formatObservedTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function gridPointToCoordinate(x: number, y: number): [number, number] {
  const worldPixels = 256 * 2 ** 7;
  const pixelX = 34 * 256 + x * 16;
  const pixelY = 52 * 256 + y * 16;
  const longitude = pixelX / worldPixels * 360 - 180;
  const latitude = Math.atan(Math.sinh(Math.PI * (1 - 2 * pixelY / worldPixels))) * 180 / Math.PI;
  return [longitude, latitude];
}

function applyProjection(map: import("maplibre-gl").Map, nowcast: RadarNowcast | null, minutes: 15 | 30 | 60 | null) {
  if (map.getLayer(projectionLayerId)) map.removeLayer(projectionLayerId);
  if (map.getSource(projectionSourceId)) map.removeSource(projectionSourceId);
  const projection = nowcast?.status === "available" && minutes ? nowcast.projections.find((item) => item.minutes === minutes) : null;
  if (!projection) return;
  map.addSource(projectionSourceId, { type: "geojson", data: { type: "Feature", properties: { radius: projection.uncertaintyPixels }, geometry: { type: "Point", coordinates: gridPointToCoordinate(projection.x, projection.y) } } });
  map.addLayer({ id: projectionLayerId, type: "circle", source: projectionSourceId, paint: { "circle-radius": ["get", "radius"], "circle-color": "#207d86", "circle-opacity": 0.18, "circle-stroke-color": "#0f555f", "circle-stroke-width": 2, "circle-stroke-opacity": 0.7 } });
}

export function LocationMap({ selection, probabilityPercent, onSelect, radar, nowcast, radarError, onRetryRadar }: LocationMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const selectedCoordinatesRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  const radarTileRef = useRef<string | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectionMinutes, setProjectionMinutes] = useState<15 | 30 | 60 | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const frames = radar?.frames ?? [];
  const activeFrame = frames[frameIndex] ?? null;

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    let cancelled = false;
    void import("maplibre-gl").then(({ Map, NavigationControl }) => {
      if (cancelled || !mapElement.current) return;

      const map = new Map({
        container: mapElement.current,
        style: {
          version: 8,
          sources: {
            openstreetmap: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "openstreetmap", type: "raster", source: "openstreetmap" }],
        },
        center: [-81.32, 28.54],
        zoom: 8.2,
        maxBounds: [[-82.05, 27.45], [-80.35, 29.2]],
      });

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        applyRadarFrame(map, radarTileRef.current);
        applyProjection(map, null, null);
        setIsMapReady(true);
      });
      map.on("click", (event) => {
        const latitude = event.lngLat.lat;
        const longitude = event.lngLat.lng;
        onSelectRef.current({
          name: `Selected point (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          latitude,
          longitude,
        });
      });
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setFrameIndex(Math.max(0, frames.length - 1));
      setIsPlaying(false);
    });
  }, [radar?.latestObservedAt, frames.length]);

  useEffect(() => {
    const tileUrl = activeFrame?.tileUrl ?? null;
    radarTileRef.current = tileUrl;
    const map = mapRef.current;
    if (map?.isStyleLoaded()) applyRadarFrame(map, tileUrl);
  }, [activeFrame?.tileUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded()) applyProjection(map, nowcast, projectionMinutes);
  }, [nowcast, projectionMinutes]);

  useEffect(() => {
    if (!isPlaying || frames.length < 2) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const interval = window.setInterval(() => setFrameIndex((index) => (index + 1) % frames.length), 850);
    return () => window.clearInterval(interval);
  }, [frames.length, isPlaying]);

  useEffect(() => {
    if (!selection || !mapRef.current || !isMapReady) return;
    let cancelled = false;

    void import("maplibre-gl").then(({ Marker }) => {
      if (cancelled || !mapRef.current) return;
      const coordinates: [number, number] = [selection.longitude, selection.latitude];
      const coordinatesKey = coordinates.join(",");
      const markerElement = markerRef.current?.getElement() ?? document.createElement("div");
      markerElement.className = "puddle-map-marker";
      markerElement.setAttribute("aria-label", `Selected location: ${selection.name}${probabilityPercent === null ? "" : `. ${probabilityPercent}% chance of measurable rain in the next hour.`}`);
      markerElement.setAttribute("aria-hidden", "true");
      markerElement.replaceChildren();

      if (!markerRef.current) {
        markerRef.current = new Marker({ element: markerElement, anchor: "bottom" }).setLngLat(coordinates).addTo(mapRef.current);
      } else {
        markerRef.current.setLngLat(coordinates);
      }

      if (selectedCoordinatesRef.current !== coordinatesKey) {
        selectedCoordinatesRef.current = coordinatesKey;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        mapRef.current.flyTo({ center: coordinates, zoom: Math.max(mapRef.current.getZoom(), 12), essential: !reduceMotion, duration: reduceMotion ? 0 : 900 });
      }
    });

    return () => { cancelled = true; };
  }, [isMapReady, probabilityPercent, selection]);

  return (
    <div className="map-shell map-shell-live">
      <div
        className="map-canvas"
        ref={mapElement}
        role="application"
        aria-label="Central Florida map. Click or tap a point to choose a location."
      />
      <div className="map-chrome"><span>{projectionMinutes ? `Projected radar · ${projectionMinutes} min` : "Observed radar"}</span><span className="map-status">Central Florida</span></div>
      <div className="radar-controls" aria-label="Live radar controls">
        {activeFrame ? (
          <>
            <p><strong>Radar observed</strong><span>{formatObservedTime(activeFrame.observedAt)}</span></p>
            <div className="radar-control-row">
              <button type="button" onClick={() => setIsPlaying((playing) => !playing && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)} disabled={frames.length < 2} aria-pressed={isPlaying}>
                {isPlaying ? "Pause" : "Play recent radar"}
              </button>
              <input aria-label="Radar frame" type="range" min="0" max={Math.max(0, frames.length - 1)} value={frameIndex} onChange={(event) => { setIsPlaying(false); setFrameIndex(Number(event.target.value)); }} />
            </div>
            <div className="nowcast-controls">
              {nowcast?.status === "available" ? <><span>Projection estimate</span><div>{([15, 30, 60] as const).map((minutes) => <button key={minutes} type="button" aria-pressed={projectionMinutes === minutes} onClick={() => { setIsPlaying(false); setProjectionMinutes((current) => current === minutes ? null : minutes); }}>{minutes}m</button>)}</div><small>{nowcast.message}</small></> : <small>{nowcast?.message ?? "Checking whether recent radar frames support a projection…"}</small>}
            </div>
          </>
        ) : (
          <div className="radar-unavailable"><strong>Radar is being stubborn.</strong><span>{radarError ?? "Loading current observations…"}</span>{radarError ? <button type="button" onClick={onRetryRadar}>Try again</button> : null}</div>
        )}
      </div>
      <p className="map-help">Click or tap anywhere on the map to set your exact location.</p>
      <div className="radar-legend" aria-label="Radar intensity legend"><span>Light rain</span><i /><span>Heavier rain</span></div>
      <a className="radar-attribution" href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">Weather data by RainViewer</a>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { LocationSelection } from "@/lib/location";
import type { RadarSnapshot } from "@/lib/radar";

type LocationMapProps = {
  selection: LocationSelection | null;
  onSelect: (location: LocationSelection) => void;
  radar: RadarSnapshot | null;
  radarError: string | null;
  onRetryRadar: () => void;
};

const radarSourceId = "puddle-radar";
const radarLayerId = "puddle-radar-layer";

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

export function LocationMap({ selection, onSelect, radar, radarError, onRetryRadar }: LocationMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const radarTileRef = useRef<string | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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
      map.on("load", () => applyRadarFrame(map, radarTileRef.current));
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
    if (!isPlaying || frames.length < 2) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const interval = window.setInterval(() => setFrameIndex((index) => (index + 1) % frames.length), 850);
    return () => window.clearInterval(interval);
  }, [frames.length, isPlaying]);

  useEffect(() => {
    if (!selection || !mapRef.current) return;
    let cancelled = false;

    void import("maplibre-gl").then(({ Marker }) => {
      if (cancelled || !mapRef.current) return;
      const coordinates: [number, number] = [selection.longitude, selection.latitude];
      const markerElement = markerRef.current?.getElement() ?? document.createElement("div");
      markerElement.className = "puddle-map-marker";
      markerElement.setAttribute("aria-label", `Selected location: ${selection.name}`);
      markerElement.innerHTML = '<span aria-hidden="true">P</span>';

      if (!markerRef.current) {
        markerRef.current = new Marker({ element: markerElement, anchor: "bottom" }).setLngLat(coordinates).addTo(mapRef.current);
      } else {
        markerRef.current.setLngLat(coordinates);
      }

      mapRef.current.flyTo({ center: coordinates, zoom: Math.max(mapRef.current.getZoom(), 12), essential: true, duration: 900 });
    });

    return () => { cancelled = true; };
  }, [selection]);

  return (
    <div className="map-shell map-shell-live">
      <div
        className="map-canvas"
        ref={mapElement}
        role="application"
        aria-label="Central Florida map. Click or tap a point to choose a location."
      />
      <div className="map-chrome"><span>Observed radar</span><span className="map-status">Central Florida</span></div>
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

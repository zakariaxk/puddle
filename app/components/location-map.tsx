"use client";

import { useEffect, useRef } from "react";
import type { LocationSelection } from "@/lib/location";

type LocationMapProps = {
  selection: LocationSelection | null;
  onSelect: (location: LocationSelection) => void;
};

export function LocationMap({ selection, onSelect }: LocationMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const onSelectRef = useRef(onSelect);

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
      <div className="map-chrome" aria-hidden="true"><span>Choose a point</span><span className="map-status">Central Florida</span></div>
      <p className="map-help">Click or tap anywhere on the map to set your exact location.</p>
    </div>
  );
}

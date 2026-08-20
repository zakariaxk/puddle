"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ConsumerForecast } from "@/lib/forecast";
import type { GeocodingResult, LocationSelection } from "@/lib/location";
import type { RadarSnapshot } from "@/lib/radar";
import { LocationMap } from "./location-map";

const horizonLabels = { 15: "15 min", 30: "30 min", 60: "1 hour", 120: "2 hours", 360: "6 hours" } as const;

export function PuddleShell() {
  const [searchMessage, setSearchMessage] = useState("Search Central Florida places or addresses.");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [selection, setSelection] = useState<LocationSelection | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [radar, setRadar] = useState<RadarSnapshot | null>(null);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ConsumerForecast | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [isForecastLoading, setIsForecastLoading] = useState(false);

  const loadRadar = useCallback(async () => {
    setRadarError(null);
    try {
      const response = await fetch("/api/radar");
      const body = await response.json() as RadarSnapshot & { error?: string };
      if (!response.ok) throw new Error(body.error);
      setRadar(body);
    } catch (error) {
      setRadar(null);
      setRadarError(error instanceof Error && error.message ? error.message : "Live radar is temporarily unavailable. Try again shortly.");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadRadar());
    const refresh = window.setInterval(() => void loadRadar(), 2 * 60 * 1000);
    return () => window.clearInterval(refresh);
  }, [loadRadar]);

  const loadForecast = useCallback(async (location: LocationSelection) => {
    setIsForecastLoading(true);
    setForecastError(null);
    try {
      const response = await fetch(`/api/forecast?latitude=${location.latitude}&longitude=${location.longitude}`);
      const body = await response.json() as ConsumerForecast & { error?: string };
      if (!response.ok) throw new Error(body.error);
      setForecast(body);
    } catch (error) {
      setForecast(null);
      setForecastError(error instanceof Error && error.message ? error.message : "Puddle could not load live forecast guidance. Try again shortly.");
    } finally {
      setIsForecastLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selection) return;
    queueMicrotask(() => void loadForecast(selection));
    const refresh = window.setInterval(() => void loadForecast(selection), 5 * 60 * 1000);
    return () => window.clearInterval(refresh);
  }, [loadForecast, selection]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("place") ?? "").trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearchMessage("Enter at least two characters to search Central Florida.");
      return;
    }

    setIsSearching(true);
    setSearchMessage("Finding places in Central Florida...");
    try {
      const response = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
      const body = await response.json() as { error?: string; results?: GeocodingResult[] };
      if (!response.ok) throw new Error(body.error);
      setSearchResults(body.results ?? []);
      setSearchMessage(body.results?.length ? "Choose a result to set your location." : "No Central Florida places matched that search.");
    } catch (error) {
      setSearchResults([]);
      setSearchMessage(error instanceof Error && error.message ? error.message : "Location search is temporarily unavailable. Try again in a moment.");
    } finally {
      setIsSearching(false);
    }
  }

  function selectLocation(location: LocationSelection) {
    setSelection(location);
    setForecast(null);
    setSearchResults([]);
    setSearchMessage(`${location.name} is selected.`);
  }

  return (
    <main className="puddle-app">
      <header className="topbar">
        <a className="brand" href="#forecast" aria-label="Puddle home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>Puddle</span>
        </a>
        <p className="topbar-promise">Know before you go.</p>
        <button className="quiet-button" type="button" onClick={() => setWhyOpen(true)}>
          How Puddle works
        </button>
      </header>

      <section className="app-intro" aria-labelledby="intro-title">
        <p className="section-label">Central Florida</p>
        <h1 id="intro-title">Is rain actually coming your way?</h1>
        <p>Choose a place to see Puddle&apos;s clearest next-hour rain read.</p>
      </section>

      <section className="weather-stage" aria-label="Puddle forecast shell">
        <div className="forecast-panel" id="forecast">
          <div className="location-block">
            <p className="section-label">Your place</p>
            <form className="search-form" onSubmit={handleSearch}>
              <label className="sr-only" htmlFor="place-search">Search for a Central Florida place</label>
              <input
                id="place-search"
                name="place"
                type="search"
                placeholder="Search a place or address"
                autoComplete="off"
              />
              <button type="submit" disabled={isSearching}>{isSearching ? "Searching" : "Search"}</button>
            </form>
            <p className="search-status" aria-live="polite">{searchMessage}</p>
            {searchResults.length ? (
              <ul className="search-results" aria-label="Location results">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button type="button" onClick={() => selectLocation(result)}>
                      <strong>{result.name.split(",")[0]}</strong>
                      <span>{result.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {selection ? <p className="selected-location" aria-live="polite"><span>Selected location</span>{selection.name}</p> : null}
          </div>

          {!selection ? <ForecastEmpty /> : isForecastLoading ? <ForecastLoading /> : forecast ? <ForecastRead forecast={forecast} /> : <ForecastError message={forecastError} onRetry={() => selection && void loadForecast(selection)} />}

          <button
            className="why-button"
            type="button"
            aria-expanded={whyOpen}
            aria-controls="why-panel"
            onClick={() => setWhyOpen((open) => !open)}
          >
            <span>Why Puddle?</span>
            <span aria-hidden="true">{whyOpen ? "−" : "+"}</span>
          </button>
          {whyOpen ? (
            <div className="why-panel" id="why-panel">
              {forecast ? <><p>{forecast.message}</p><ul>{forecast.why.map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="forecast-sources"><strong>Sources</strong>{forecast.sources.map((source) => <span key={source.id}>{source.dataset}: {source.status}{source.sourceTimestamp ? ` · ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(source.sourceTimestamp))}` : ""}</span>)}</div></> : "Puddle uses live National Weather Service forecast guidance and nearby observations. It will not guess when guidance is unavailable."}
            </div>
          ) : null}
        </div>

        <LocationMap selection={selection} onSelect={selectLocation} radar={radar} radarError={radarError} onRetryRadar={() => void loadRadar()} />
      </section>
    </main>
  );
}

function ForecastEmpty() {
  return <div className="forecast-unavailable" aria-labelledby="forecast-title"><div className="forecast-copy"><p className="section-label">Next hour</p><h2 id="forecast-title">Waiting on your location</h2><p>Rain probability, timing, and confidence appear here after a place is selected.</p></div><div className="forecast-placeholder" aria-label="Forecast loading placeholder"><span /><span /><span /></div></div>;
}

function ForecastLoading() {
  return <div className="forecast-unavailable" aria-live="polite"><div className="forecast-copy"><p className="section-label">Next hour</p><h2>Reading live guidance</h2><p>Puddle is checking the latest National Weather Service forecast for this point.</p></div><div className="forecast-placeholder" aria-label="Loading forecast"><span /><span /><span /></div></div>;
}

function ForecastError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return <div className="forecast-unavailable forecast-error" role="status"><div className="forecast-copy"><p className="section-label">Next hour</p><h2>Forecast temporarily unavailable</h2><p>{message ?? "Puddle could not load live forecast guidance."}</p><button type="button" className="retry-button" onClick={onRetry}>Try again</button></div></div>;
}

function ForecastRead({ forecast }: { forecast: ConsumerForecast }) {
  const hero = forecast.horizons.find((horizon) => horizon.minutes === 60)!;
  return <>
    <div className="forecast-read" aria-live="polite">
      <div><p className="section-label">Chance of measurable rain in the next hour</p><p className="hero-probability">{hero.probabilityPercent}<span>%</span></p><p className="forecast-summary">{hero.arrival ? `Most likely window: ${hero.arrival}` : "No meaningful rain window indicated."}</p></div>
      <dl className="forecast-details"><div><dt>Intensity</dt><dd>{hero.intensity === "none" ? "None indicated" : `${hero.intensity[0].toUpperCase()}${hero.intensity.slice(1)} rain`}</dd></div><div><dt>Confidence</dt><dd>{forecast.confidence[0].toUpperCase() + forecast.confidence.slice(1)}</dd></div></dl>
      {forecast.status === "degraded" ? <p className="forecast-degraded">Reduced confidence: some live inputs are unavailable or stale.</p> : null}
    </div>
    <div className="horizon-list" aria-label="Rain forecast horizons">
      {forecast.horizons.map((horizon) => <div className={`horizon ${horizon.minutes === 60 ? "horizon-active" : ""}`} key={horizon.minutes}><span>{horizonLabels[horizon.minutes]}</span><strong>{horizon.probabilityPercent}%</strong><i aria-hidden="true" style={{ width: `${Math.max(8, horizon.probabilityPercent)}%` }} /></div>)}
    </div>
  </>;
}

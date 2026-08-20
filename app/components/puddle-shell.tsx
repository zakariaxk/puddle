"use client";

import { FormEvent, useState } from "react";
import type { GeocodingResult, LocationSelection } from "@/lib/location";
import { LocationMap } from "./location-map";

const horizons = ["15 min", "30 min", "1 hour", "2 hours", "6 hours"];

export function PuddleShell() {
  const [searchMessage, setSearchMessage] = useState("Search Central Florida places or addresses.");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [selection, setSelection] = useState<LocationSelection | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

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

          <div className="forecast-unavailable" aria-labelledby="forecast-title">
            <div className="forecast-copy">
              <p className="section-label">Next hour</p>
              <h2 id="forecast-title">Waiting on your location</h2>
              <p>Rain probability, timing, and confidence appear here after a place is selected.</p>
            </div>
            <div className="forecast-placeholder" aria-label="Forecast loading placeholder">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="horizon-list" aria-label="Forecast horizons loading">
            {horizons.map((horizon) => (
              <div className="horizon" key={horizon}>
                <span>{horizon}</span>
                <i aria-hidden="true" />
              </div>
            ))}
          </div>

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
              Puddle will combine current observations, radar movement, and short-range forecasts. Until live sources are connected, it will not guess.
            </div>
          ) : null}
        </div>

        <LocationMap selection={selection} onSelect={selectLocation} />
      </section>
    </main>
  );
}

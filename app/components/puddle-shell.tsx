"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

const horizons = ["15 min", "30 min", "1 hour", "2 hours", "6 hours"];

export function PuddleShell() {
  const [searchMessage, setSearchMessage] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchMessage("Location search will be ready with the live map.");
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
              <button type="submit">Search</button>
            </form>
            <p className="search-status" aria-live="polite">{searchMessage}</p>
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

        <div className="map-shell" aria-label="Map loading surface">
          <div className="map-chrome">
            <span>Rain map</span>
            <span className="map-status">Preparing map</span>
          </div>
          <div className="map-skeleton" aria-hidden="true">
            <div className="map-contour contour-one" />
            <div className="map-contour contour-two" />
            <div className="map-contour contour-three" />
            <div className="map-location-pulse" />
          </div>
          <div className="map-loading-note">
            <Image src="/mascot/puddle-mascot.png" alt="Puddle mascot watching the sky" width={82} height={82} priority />
            <div>
              <strong>Map is getting ready</strong>
              <span>Live rain appears here soon.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
